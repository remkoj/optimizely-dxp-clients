import type { CliModule } from '../types.js'
import { CmsIntegrationApiClient, IntegrationApi, ContentRoots } from '@remkoj/optimizely-cms-api'
import createClient from '../tools/cmsClient.js'
import chalk from 'chalk'
import figures from 'figures'
import { confirm } from '@inquirer/prompts'

const reservedTypes = [
    'ImageMedia',
    'VideoMedia',
    'GenericMedia'
]
const reservedKeys: string[] = [
    ContentRoots.ForAllSites,
    ContentRoots.MultiChannelContent,
    ContentRoots.SystemRoot,
    ContentRoots.Trash
]

export const CmsResetCommand: CliModule = {
    command: "cms:reset",
    describe: "Completely clear & reset the CMS Database",
    handler: async (args) => {
        const client = createClient(args)

        //#region Confirmations        
        const doDelete = await confirm({
            message: "This will remove all data and configuration from the SaaS CMS Instance, are you sure?",
            default: false
        })
        if (!doDelete) {
            process.stdout.write(`${chalk.redBright(figures.cross)} Cancelled\n`)
            process.exit(1)
        }

        const didRemoveApplications = await confirm({
            message: "Did you manually remove all Applications from the CMS?",
            default: false
        })
        if (!didRemoveApplications) {
            const appUrl = new URL('/ui/EPiServer.Cms.UI.Admin/default#/Applications', client.cmsUrl)
            process.stdout.write(`${chalk.redBright(figures.cross)} Applications must be removed manually, please remove and restart command.\n`)
            process.stdout.write(`  ${figures.arrowRight} Application manager: ${appUrl}\n`)
            process.exit(1)
        }

        const didRemoveBlueprints = await confirm({
            message: "Did you manually remove all BluePrints from the CMS?",
            default: false
        })
        if (!didRemoveBlueprints) {
            const bpUrl = new URL('/ui/EPiServer.Cms.UI.VisualBuilder/BlueprintManager', client.cmsUrl)
            process.stdout.write(`${chalk.redBright(figures.cross)} Blueprints must be removed manually, please remove and restart command.\n`)
            process.stdout.write(`  ${figures.arrowRight} Blueprint manager: ${bpUrl}\n`)
            process.exit(1)
        }

        const didRemoveCustomProperties = await confirm({
            message: "Did you manually remove all custom properties from the \"Blank Section\" and \"Blank Experience\" Content Types?",
            default: false
        })
        if (!didRemoveCustomProperties) {
            const ctUrl = new URL('/ui/EPiServer.Cms.UI.Admin/default#/ContentTypes', client.cmsUrl)
            process.stdout.write(`${chalk.redBright(figures.cross)} Custom properties on the \"Blank Section\" and \"Blank Experience\" Content Types must be removed manually, please remove and restart command.\n`)
            process.stdout.write(`  ${figures.arrowRight} Content Type manager: ${ctUrl}\n`)
            process.exit(1)
        }
        //#endregion

        //#region Removing Content Items
        process.stdout.write(`\n${chalk.yellowBright(figures.star)} Removing all content\n`)
        const contentItems = await deleteContentItem(client, ContentRoots.SystemRoot, true)
        process.stdout.write(`${chalk.greenBright(figures.tick)} Removed ${contentItems} items from the system root\n`)
        const assets = await deleteContentItem(client, ContentRoots.ForAllSites, true)
        process.stdout.write(`${chalk.greenBright(figures.tick)} Removed ${assets} items from the global items\n`)
        const multiChannelContents = await deleteContentItem(client, ContentRoots.MultiChannelContent, true)
        process.stdout.write(`${chalk.greenBright(figures.tick)} Removed ${multiChannelContents} items from the multi-channel content\n`)
        const trash = await deleteContentItem(client, ContentRoots.Trash, true)
        process.stdout.write(`${chalk.greenBright(figures.tick)} Removed ${trash} items from the trash\n`)
        //#endregion

        //#region Removing Content Types
        process.stdout.write(`\n${chalk.yellowBright(figures.star)} Removing content types\n`)
        const resetTypesResult = await resetSystemTypes(client)
        process.stdout.write(`${chalk.greenBright(figures.tick)} Reset ${resetTypesResult} content types to defaults\n`)
        const contentTypes = await removeContentTypes(client)
        process.stdout.write(`${chalk.greenBright(figures.tick)} Removed ${contentTypes} content types\n`)
        //#endregion
        
        process.stdout.write(`\n${chalk.yellowBright(figures.star)} Removing display templates\n`)
        const removeTemplatesResult = await removeDisplayTemplates(client)
        process.stdout.write(`${chalk.greenBright(figures.tick)} Removed ${removeTemplatesResult} display templates\n`)
    }
}

async function deleteContentItem(client: CmsIntegrationApiClient, key: string, onlyChildren: boolean = false): Promise<number> {
    if (client.debug)
        process.stdout.write(chalk.gray(`  ${figures.arrowRight} Removing ${onlyChildren ? 'children of ' : ''} content item: ${key}\n`))
    const children = await getContentItemChildren(client, key)
    let hasError = false
    let removedCount = 0
    for (let child of children.items)
        if (child.key) {
            removedCount = removedCount + await deleteContentItem(client, child.key).catch(e => {
                console.error(e)
                hasError = true
                return 0
            })
        }
    for (let child of children.assets)
        if (child.key) {
            removedCount = removedCount + await deleteContentItem(client, child.key).catch(e => {
                console.error(e)
                hasError = true
                return 0
            })
        }

    if (hasError)
        throw new Error("Unable to delete all assets and children")
    if (client.debug)
        process.stdout.write(chalk.gray(`  ${figures.tick} Removed ${removedCount} children and assets for item: ${key}\n`))
    if (onlyChildren)
        return removedCount

    if (reservedKeys.includes(key)) {
        if (client.debug)
            process.stderr.write(chalk.redBright(`  ${ figures.cross }The ContentItem ${key} is a reserved item, skipping deletion\n`))
        return removedCount
    }

    const deleteResult = await client.content.contentDelete(key, true).then(r => r.key).catch((e: IntegrationApi.ApiError) => {
        if (e.status == 404)
            return key
        throw e
    })
    if (client.debug)
        process.stdout.write(chalk.gray(`  ${figures.tick} Removed ${deleteResult}\n`))

    return (removedCount + 1)
}

async function getContentItemChildren(client: CmsIntegrationApiClient, parentKey: string) {
    const items = await getAllItems(client, parentKey)
    const assets = await getAllAssets(client, parentKey)
    return {
        items, assets
    }
}

async function resetSystemTypes(client: CmsIntegrationApiClient) : Promise<number> {
    let resetTypes : number = 0
    for (const systemType of reservedTypes) {
        if (client.debug)
            process.stdout.write(chalk.gray(`  ${figures.arrowRight} Resetting ${systemType} by removing all attributes\n`))
        const newType: IntegrationApi.ContentType | undefined | null = await client.contentTypes.contentTypesPatch(systemType, {
            key: systemType,
            properties: {}
        }, true).catch((e: IntegrationApi.ApiError) => e.status == 404 ? undefined : null)
        
        if (newType)
            resetTypes++
    }
    return resetTypes
}

async function removeContentTypes(client: CmsIntegrationApiClient) : Promise<number> {
    const contentTypes = await getAllTypes(client)
    let removedCount = 0
    
    for (let contentType of contentTypes.filter(item => item.source == '' && !reservedTypes.includes(item.key))) {
        if (client.debug)
            process.stdout.write(`  ${chalk.blueBright(figures.arrowRight)} Removing content type ${contentType.displayName} (${ contentType.key })\n`)
        const result : IntegrationApi.ContentType | null = await client.contentTypes.contentTypesDelete(contentType.key).catch((e: IntegrationApi.ApiError) => {
            if (e.status == 404)
                return contentType
            return null
        })
        if (result)
            removedCount++
    }
    return removedCount
}

async function removeDisplayTemplates(client: CmsIntegrationApiClient) : Promise<number> {
    const allTemplates = await getAllTemplates(client)
    let removedTemplateCount = 0
    for (const template of allTemplates) {
        if (client.debug)
            process.stdout.write(`  ${chalk.blueBright(figures.arrowRight)} Removing display template ${template.displayName} (${ template.key })\n`)
        const deleteResult = client.displayTemplates.displayTemplatesDelete(template.key).catch((e: IntegrationApi.ApiError) => {
            if (e.status == 404)
                return template
            console.log(e.body)
            return null
        })
        if (deleteResult)
            removedTemplateCount++
    }
    return removedTemplateCount
}

async function getAllTemplates(client: CmsIntegrationApiClient, batchSize: number = 100): Promise<IntegrationApi.DisplayTemplate[]> {
    const items = await client.displayTemplates.displayTemplatesList(0, batchSize).catch((e: IntegrationApi.ApiError) => {
        if (e.status == 404) {
            return {
                items: [],
                totalItemCount: 0,
                pageSize: batchSize,
            } as IntegrationApi.DisplayTemplatePage
        }
        throw e
    })
    const totalItemCount = items.totalItemCount ?? items.items?.length ?? 0
    const pageSize = items.pageSize ?? items.items?.length ?? 0
    const actualItems = items.items ?? []
    const pageCount = Math.ceil(totalItemCount / pageSize)

    for (let pageNr = 1; pageNr < pageCount; pageNr++) {
        const pageData = await client.displayTemplates.displayTemplatesList(pageNr, pageSize).catch((e: IntegrationApi.ApiError) => {
            if (e.status == 404) {
                return {
                    items: [],
                    totalItemCount: 0,
                    pageSize: batchSize,
                } as IntegrationApi.DisplayTemplatePage
            }
            throw e
        })
        actualItems.push(...(pageData.items ?? []))
    }

    return actualItems
}

async function getAllTypes(client: CmsIntegrationApiClient, batchSize: number = 100): Promise<IntegrationApi.ContentType[]> {
    const items = await client.contentTypes.contentTypesList(undefined, undefined, 0, batchSize).catch((e: IntegrationApi.ApiError) => {
        if (e.status == 404) {
            return {
                items: [],
                totalItemCount: 0,
                pageSize: batchSize,
            } as IntegrationApi.ContentTypePage
        }
        throw e
    })
    const totalItemCount = items.totalItemCount ?? items.items?.length ?? 0
    const pageSize = items.pageSize ?? items.items?.length ?? 0
    const actualItems = items.items ?? []
    const pageCount = Math.ceil(totalItemCount / pageSize)

    for (let pageNr = 1; pageNr < pageCount; pageNr++) {
        const pageData = await client.contentTypes.contentTypesList(undefined, undefined, pageNr, pageSize).catch((e: IntegrationApi.ApiError) => {
            if (e.status == 404) {
                return {
                    items: [],
                    totalItemCount: 0,
                    pageSize: batchSize,
                } as IntegrationApi.ContentTypePage
            }
            throw e
        })
        actualItems.push(...(pageData.items ?? []))
    }

    return actualItems
}

async function getAllAssets(client: CmsIntegrationApiClient, parentKey: string, batchSize: number = 100): Promise<IntegrationApi.ContentMetadata[]> {
    const items = await client.content.contentListAssets(parentKey, undefined, 0, batchSize).catch((e: IntegrationApi.ApiError) => {
        if (e.status == 404) {
            return {
                items: [],
                totalItemCount: 0,
                pageSize: batchSize,
            } as IntegrationApi.ContentMetadataPage
        }
        throw e
    })
    const totalItemCount = items.totalItemCount ?? items.items?.length ?? 0
    const pageSize = items.pageSize ?? items.items?.length ?? 0
    const actualItems = items.items ?? []
    const pageCount = Math.ceil(totalItemCount / pageSize)

    for (let pageNr = 1; pageNr < pageCount; pageNr++) {
        const pageData = await client.content.contentListAssets(parentKey, undefined, pageNr, pageSize).catch((e: IntegrationApi.ApiError) => {
            if (e.status == 404) {
                return {
                    items: [],
                    totalItemCount: 0,
                    pageSize: batchSize,
                } as IntegrationApi.ContentMetadataPage
            }
            throw e
        })
        actualItems.push(...(pageData.items ?? []))
    }

    return actualItems
}

async function getAllItems(client: CmsIntegrationApiClient, parentKey: string, batchSize: number = 100): Promise<IntegrationApi.ContentMetadata[]> {
    const items = await client.content.contentListItems(parentKey, undefined, 0, batchSize).catch((e: IntegrationApi.ApiError) => {
        if (e.status == 404) {
            return {
                items: [],
                totalItemCount: 0,
                pageSize: batchSize,
            } as IntegrationApi.ContentMetadataPage
        }
        throw e
    })
    const totalItemCount = items.totalItemCount ?? items.items?.length ?? 0
    const pageSize = items.pageSize ?? items.items?.length ?? 0
    const actualItems = items.items ?? []
    const pageCount = Math.ceil(totalItemCount / pageSize)

    for (let pageNr = 1; pageNr < pageCount; pageNr++) {
        const pageData = await client.content.contentListItems(parentKey, undefined, pageNr, pageSize).catch((e: IntegrationApi.ApiError) => {
            if (e.status == 404) {
                return {
                    items: [],
                    totalItemCount: 0,
                    pageSize: batchSize,
                } as IntegrationApi.ContentMetadataPage
            }
            throw e
        })
        actualItems.push(...(pageData.items ?? []))
    }

    return actualItems
}

export default CmsResetCommand