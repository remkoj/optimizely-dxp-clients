import type { CliModule } from '../types.js'
import { parseArgs } from '../tools/parseArgs.js'
import { type IntegrationApi, OptiCmsVersion } from '@remkoj/optimizely-cms-api'
import chalk from 'chalk'
import figures from 'figures'
import fs from 'node:fs'
import path from 'node:path'

import { createCmsClient  } from '../tools/cmsClient.js'
import { StylesArgs, stylesBuilder, getStyles } from '../tools/styles.js'

type StylesPullModule = CliModule<{
    definitions?: boolean
    force?: boolean
} & StylesArgs>

export const StylesPullCommand : StylesPullModule = {
    command: "styles:pull",
    describe: "Create Visual Builder style definitions from the CMS",
    builder: (yargs) => {
        const newYargs = stylesBuilder(yargs)
        newYargs.option('force', { alias: 'f', description: "Overwrite existing files", boolean: true, type: 'boolean', demandOption: false, default: false })
        newYargs.option("definitions", { alias: 'd', description: "Create/overwrite typescript definitions", boolean: true, type: 'boolean', demandOption: false, default: true})
        return newYargs
    },
    handler: async (args) => {
        const { _config: cfg, components: basePath, force, definitions } = parseArgs(args)
        const client = createCmsClient(args)
        if (client.runtimeCmsVersion == OptiCmsVersion.CMS12) {
            process.stdout.write(chalk.gray(`${ figures.cross } Styles are not supported on CMS12\n`))
            return
        }

        const { styles: filteredResults } = await getStyles(client, args)

        //#region Create & Write opti-style.json files
        const typeFiles : Record<string, { templates: Array<{ file: string, data: IntegrationApi.DisplayTemplate }>, filePath: string }> = {}
        const updatedTemplates = (await Promise.all(filteredResults.map(async displayTemplate => {
            let itemPath : string | undefined = undefined
            let targetType : string
            let typesPath : string
            if (displayTemplate.nodeType) {
                itemPath = path.join(basePath,'nodes',displayTemplate.nodeType,displayTemplate.key)
                typesPath = path.join(basePath,'nodes',displayTemplate.nodeType)
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
            if (fs.existsSync(filePath)) {
                if (!force) {
                    if (cfg.debug)
                        process.stdout.write(chalk.gray(`${ figures.cross } Skipping style file for ${ displayTemplate.key } - File already exists\n`))
                    return
                }
                if (cfg.debug)
                    process.stdout.write(chalk.gray(`${ figures.arrowRight } Overwriting style file for ${ displayTemplate.key }\n`))
            } else if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Creating style file for ${ displayTemplate.key }\n`))
            
            fs.writeFileSync(filePath, JSON.stringify(displayTemplate, undefined, 2))

            if (!typeFiles[targetType]) {
                typeFiles[targetType] = {
                    filePath: path.join(typesPath,'displayTemplates.ts'),
                    templates: []
                }
            }
            typeFiles[targetType].templates.push({ file: filePath, data: displayTemplate})
            
            return displayTemplate.key
        }))).filter(x => x)
        //#endregion
        
        //#region Create needed definition files
        if (definitions) {
            for (const targetId of Object.getOwnPropertyNames(typeFiles)) {
                const { filePath: typeFilePath, templates } = typeFiles[targetId]

                if (fs.existsSync(typeFilePath)) {
                    if (!force) {
                        if (cfg.debug)
                            process.stdout.write(chalk.gray(`${ figures.cross } Skipped writing definition file for ${ targetId } - it already exists\n`))
                        continue
                    }
                    if (cfg.debug)
                        process.stdout.write(chalk.gray(`${ figures.arrowRight } Overwriting definition file for ${ targetId }\n`))
                } else if (cfg.debug)
                    process.stdout.write(chalk.gray(`${ figures.arrowRight } Creating definition file for ${ targetId }\n`))
                
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

export type ${ typeId }Component<DT extends Record<string, any> = Record<string, any>, LP extends ${ typeId }LayoutProps = ${ typeId }LayoutProps> = (props: ${ typeId }ComponentProps<DT,LP>) => ReactNode

export function isDefaultProps(props?: ${ typeId }LayoutProps | null) : props is ${ templates.filter(t => t.data.isDefault).at(0)?.data?.key }Props
{
    return props?.template == "${ templates.filter(t => t.data.isDefault).at(0)?.data?.key }"
}`)
                    templates.forEach(t => {
                        typeContents.push(`
export function is${ t.data.key }Props(props?: ${ typeId }LayoutProps | null) : props is ${ t.data.key }Props
{
    return props?.template == "${ t.data.key }"
}`)
                    })
                }

                fs.writeFileSync(typeFilePath, imports.join("\n") + "\n\n" + typeContents.join("\n"))
            }
        }
        //#endregion

        process.stdout.write(chalk.green(chalk.bold(figures.tick+` Created/updated style definitions for ${ updatedTemplates.join(', ') }`))+"\n")
    }
}
export default StylesPullCommand

function ucFirst(input: string) 
{
    if (typeof(input) != 'string' || input.length < 1)
        return input
    return input[0].toUpperCase() + input.substring(1)
}