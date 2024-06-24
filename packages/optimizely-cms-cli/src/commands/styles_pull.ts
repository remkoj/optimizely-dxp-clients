import type { CliModule } from '../types.js'
import { parseArgs } from '../tools/parseArgs.js'
import { createClient, type IntegrationApi } from '@remkoj/optimizely-cms-api'
import chalk from 'chalk'
import figures from 'figures'
import fs from 'node:fs'
import path from 'node:path'

type StylesPullModule = CliModule<{
    excludeTemplates: string[]
    templates?: string[]
    definitions?: boolean
    force?: boolean
}>

export const StylesPullCommand : StylesPullModule = {
    command: "styles:pull",
    describe: "Create Visual Builder style definitions from the CMS",
    builder: (yargs) => {
        yargs.option('force', { alias: 'f', description: "Overwrite existing files", boolean: true, type: 'boolean', demandOption: false, default: false })
        yargs.option("excludeTemplates", { alias: 'e', description: "Exclude these templates", string: true, type: 'array', demandOption: false, default: []})
        yargs.option("templates", { alias: 't', description: "Select only these templates", string: true, type: 'array', demandOption: false, default: []})
        yargs.option("definitions", { alias: 'd', description: "Create/overwrite typescript definitions", boolean: true, type: 'boolean', demandOption: false, default: false})
        return yargs
    },
    handler: async (args) => {
        const { _config: cfg, components: basePath, force, definitions, excludeTemplates, templates } = parseArgs(args)
        const client = createClient(cfg)
        const pageSize = 100

        //#region Load all templates from Optimizely CMS
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
        //#endregion

        //#region Ensure target base path exists
        if (!fs.existsSync(basePath))
            fs.mkdirSync(basePath, { recursive: true })
        if (!fs.statSync(basePath).isDirectory()) {
            process.stderr.write(chalk.redBright(`${ chalk.bold(figures.cross) } The components path ${ basePath } is not a folder\n`))
            process.exit(1)
        }
        //#endregion

        //#region Apply template filters
        const filteredResults = results.filter(result => {
            if (excludeTemplates.includes(result.key)) return false
            if (templates.length > 0 && !templates.includes(result.key)) return false
            return true
        })
        //#endregion

        //#region Create & Write opti-style.json files
        const typeFiles : Record<string, { templates: Array<{ file: string, data: IntegrationApi.DisplayTemplate }>, filePath: string }> = {}
        const updatedTemplates = (await Promise.all(filteredResults.map(async displayTemplate => {
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
            typeFiles[targetType].templates.push({ file: filePath, data: displayTemplate})
            
            return displayTemplate.key
        })))
        //#endregion
        
        //#region Create needed definition files
        if (definitions) {
            for (const targetId of Object.getOwnPropertyNames(typeFiles)) {
                const { filePath: typeFilePath, templates } = typeFiles[targetId]

                if (fs.existsSync(typeFilePath) && !force) {
                    if (cfg.debug)
                        process.stdout.write(chalk.gray(`${ figures.cross } Skipped writing definition file ${ typeFilePath } as it already exists\n`))
                    continue
                }
                
                // Write Style definition
                const imports : string[] = ['import type { LayoutProps } from "@remkoj/optimizely-cms-react/components"','import type { ReactNode } from "react"']
                const typeContents : string[] = []
                const props : string[] = []
                let typeId : string | undefined = targetId.split('/',2)[1]
                templates.forEach(({ file: displayTemplateFile, data: displayTemplate }) => {
                    const importPath = path.relative(path.dirname(typeFilePath), displayTemplateFile).replaceAll('\\','/')
                    imports.push(`import type ${ displayTemplate.key }Styles from "./${ importPath }"`)
                    typeContents.push(`export type ${ displayTemplate.key }Props = LayoutProps<typeof ${ displayTemplate.key }Styles>`)
                    typeContents.push(`export type ${ displayTemplate.key }ComponentProps<DT extends Record<string, any> = Record<string, any>> = {
    data: DT
    layoutProps: ${ displayTemplate.key }Props | undefined
} & JSX.IntrinsicElements['div']`)
                    typeContents.push(`export type ${ displayTemplate.key }Component<DT extends Record<string, any> = Record<string, any>> = (props: ${ displayTemplate.key }ComponentProps<DT>) => ReactNode`)
                    typeContents.push('')
                    props.push(`${ displayTemplate.key }Props`)
                    if (!typeId)
                        typeId = displayTemplate.nodeType ?? displayTemplate.baseType ?? displayTemplate.contentType
                })

                if (typeId) {
                    typeId = ucFirst(typeId)
                    typeContents.push('')
                    typeContents.push(`export type ${ typeId }LayoutProps = ${ props.join(' | ')}
export type ${ typeId }ComponentProps<DT extends Record<string, any> = Record<string, any>, LP extends ${ typeId }LayoutProps = ${ typeId }LayoutProps> = {
    data: DT
    layoutProps: LP | undefined
} & JSX.IntrinsicElements['div']

export type ${ typeId }Component<DT extends Record<string, any> = Record<string, any>, LP extends ${ typeId }LayoutProps = ${ typeId }LayoutProps> = (props: ${ typeId }ComponentProps<DT,LP>) => ReactNode`)
                }

                fs.writeFileSync(typeFilePath, imports.join("\n") + "\n\n" + typeContents.join("\n"))
            }
        }
        //#endregion

        process.stdout.write(chalk.yellowBright(`${ figures.arrowRight } Created/updated style definitions for ${ updatedTemplates.join(', ') }\n`))
        process.stdout.write(chalk.green(chalk.bold(figures.tick+" Done"))+"\n")
    }
}
export default StylesPullCommand

function ucFirst(input: string) 
{
    if (typeof(input) != 'string' || input.length < 1)
        return input
    return input[0].toUpperCase() + input.substring(1)
}