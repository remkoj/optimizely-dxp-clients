import type { CliModule } from '../types.js'
import { parseArgs } from '../tools/parseArgs.js'
import { createClient } from '@remkoj/optimizely-cms-api'
import chalk from 'chalk'
import figures from 'figures'
import fs from 'node:fs'
import path from 'node:path'

export const StylesPullCommand : CliModule = {
    command: "styles:pull",
    describe: "Create Visual Builder style definitions from the CMS",
    handler: async (args) => {
        const { _config: cfg, components: basePath } = parseArgs(args)
        const client = createClient(cfg)
        const pageSize = 100

        process.stdout.write(chalk.yellowBright(`${ figures.arrowRight } Reading DisplayStyles from Optimizely CMS\n`))

        if (cfg.debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Fetching page 1 of ? (${ pageSize } items per page)\n`))
        let templatesPage = await client.displayTemplates.displayTemplatesList(0, pageSize)
        const results : (typeof templatesPage)["items"] = templatesPage.items ?? []
        let pagesRemaining = Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) - (templatesPage.pageIndex + 1)

        while (pagesRemaining > 0 && results.length < templatesPage.totalItemCount) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Fetching page ${ templatesPage.pageIndex + 2 } of ${ Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) } (${ templatesPage.pageSize } items per page)\n`))
            templatesPage = await client.displayTemplates.displayTemplatesList(templatesPage.pageIndex + 1, templatesPage.pageSize)
            results.push(...templatesPage.items)
            pagesRemaining = Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) - (templatesPage.pageIndex + 1)
        }

        if (cfg.debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Fetched ${ results.length } Content-Types from Optimizely CMS\n`))

        if (!fs.existsSync(basePath))
            fs.mkdirSync(basePath, { recursive: true })

        if (!fs.statSync(basePath).isDirectory()) {
            process.stderr.write(chalk.redBright(`${ chalk.bold(figures.cross) } The components path ${ basePath } is not a folder\n`))
            process.exit(1)
        }

        const typeFiles : Record<string, { templates: typeof results, filePath: string }> = {}
        const updatedTemplates = await Promise.all(results.map(async displayTemplate => {
            let itemPath : string | undefined = undefined
            let targetType : string
            let typesPath : string
            if (displayTemplate.nodeType) {
                itemPath = path.join(basePath,'styles',displayTemplate.nodeType,displayTemplate.key)
                typesPath = path.join(basePath,'styles',displayTemplate.nodeType)
                targetType = 'node/'+displayTemplate.nodeType
            } else if (displayTemplate.baseType) {
                itemPath = path.join(basePath,displayTemplate.baseType,'styles',displayTemplate.key)
                typesPath = path.join(basePath,displayTemplate.baseType,'styles')
                targetType = 'base/'+displayTemplate.baseType
            } else if (displayTemplate.contentType) {
                const contentType = await client.contentTypes.contentTypesGet(displayTemplate.contentType ?? '-')
                itemPath = path.join(basePath,contentType.baseType,contentType.key)
                typesPath = path.join(basePath,contentType.baseType,contentType.key)
                targetType = 'content/'+displayTemplate.contentType
            }

            if (!fs.existsSync(itemPath))
                fs.mkdirSync(itemPath, { recursive: true })

            // Write Style JSON
            const filePath = path.join(itemPath,`${ displayTemplate.key }.opti-style.json`)
            fs.writeFileSync(filePath, JSON.stringify(displayTemplate, undefined, 2))

            if (!typeFiles[targetType]) {
                typeFiles[targetType] = {
                    filePath: path.join(typesPath,'displayTemplates.ts'),
                    templates: []
                }
            }
            typeFiles[targetType].templates.push(displayTemplate)
            
            return displayTemplate.key
        }))
        
        for (const targetId of Object.getOwnPropertyNames(typeFiles)) {
            const { filePath: typeFilePath, templates } = typeFiles[targetId]
            
            // Write Style definition
            const typeContents : string[] = []
            let typeId : string | undefined = undefined
            templates.forEach(displayTemplate => {
                if (Object.getOwnPropertyNames(displayTemplate.settings).length > 0) {
                    typeContents.push(`export type ${ displayTemplate.key }Settings = Array<`)
                    const typeSettings : string[] = []
                    for (const settingName of Object.getOwnPropertyNames(displayTemplate.settings)) {
                        const settingOptions = '"'+Object.getOwnPropertyNames(displayTemplate.settings[settingName].choices).join('" | "')+'"'
                        typeSettings.push(`    { key: "${settingName}", value: ${ settingOptions }}`)
                    }
                    typeContents.push(typeSettings.join(" |\n"))
                    typeContents.push('>')
                } else {
                    typeContents.push(`export type ${ displayTemplate.key }Settings = []`)
                }
                typeContents.push(`export type ${ displayTemplate.key }LayoutProps = {`)
                typeContents.push(`    template: "${ displayTemplate.key }"`)
                typeContents.push(`    settings: ${ displayTemplate.key }Settings`)
                typeContents.push(`}`)

                typeId = displayTemplate.contentType ?? displayTemplate.baseType ?? displayTemplate.nodeType
                typeId = typeId[0]?.toUpperCase() + typeId.substring(1) + "LayoutProps"
            })
            typeContents.push(`export type ${ typeId } = ${ templates.map(t => t.key + "LayoutProps").join(' | ') }`)
            typeContents.push(`export default ${ typeId }`)
            fs.writeFileSync(typeFilePath, typeContents.join("\n"))
        }

        process.stdout.write(chalk.yellowBright(`${ figures.arrowRight } Created/updated style definitions for ${ updatedTemplates.join(', ') }\n`))
        process.stdout.write(chalk.green(chalk.bold(figures.tick+" Done"))+"\n")
    }
}
export default StylesPullCommand