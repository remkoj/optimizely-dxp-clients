import type { CliModule } from '../types.js'
import { parseArgs } from '../tools/parseArgs.js'
import chalk from 'chalk'
import figures from 'figures'
import path from 'node:path'
import fsAsync from 'node:fs/promises'
import fs from 'node:fs'

import { createCmsClient } from '../tools/cmsClient.js'
import { StylesArgs, stylesBuilder, getStyles, TypeFilesListEntry, toTypeFilesList } from '../tools/styles.js'
import { ucFirst } from '../tools/string.js'
import { IntegrationApi } from '@remkoj/optimizely-cms-api'

type StylesPullModule = CliModule<{
  definitions?: boolean
  force?: boolean
} & StylesArgs>

export const StylesPullCommand: StylesPullModule = {
  command: "styles:pull",
  describe: "Create Visual Builder style definitions from the CMS",
  builder: (yargs) => {
    const newYargs = stylesBuilder(yargs)
    newYargs.option('force', { alias: 'f', description: "Overwrite existing files", boolean: true, type: 'boolean', demandOption: false, default: false })
    newYargs.option("definitions", { alias: 'u', description: "Create/overwrite typescript definitions", boolean: true, type: 'boolean', demandOption: false, default: true })
    return newYargs
  },
  handler: async (args) => {
    const { _config: cfg, components: basePath, force, definitions } = parseArgs(args)
    const client = createCmsClient(args)
    const { styles: filteredResults } = await getStyles(client, args)

    process.stdout.write(chalk.gray(`${figures.arrowRight} Start creating .opti-style.json files\n`));
    const styleFiles = await toTypeFilesList(filteredResults, client, basePath);
    const updatedTemplates: string[] = [];

    for (const groupIdentifier of styleFiles.keys()) {
      const displayTemplateGroup = styleFiles.get(groupIdentifier);

      for (const { file: filePath, data: displayTemplate } of (displayTemplateGroup?.templates || [])) {
        // Write JSON to disk
        var updatedJson = await createDisplayTemplateFile(displayTemplate, filePath, force, cfg.debug);
        if (updatedJson) updatedTemplates.push(displayTemplate.key);
      }
        
      // Write template to disk
      void await createDisplayTemplateHelper(displayTemplateGroup, groupIdentifier, force, cfg.debug);
    }
    
    process.stdout.write(chalk.green(chalk.bold(figures.tick + ` Created/updated style definitions for ${updatedTemplates.join(', ')}`)) + "\n")
  }
}
export default StylesPullCommand


export async function createDisplayTemplateFile(displayTemplate: IntegrationApi.DisplayTemplate, filePath: string, force: boolean = false, debug: boolean = false): Promise<boolean>
{
  let updated = false;
  // Build local style data
  const outputTemplate = { ...displayTemplate }
  if (outputTemplate.createdBy) delete outputTemplate.createdBy
  if (outputTemplate.lastModifiedBy) delete outputTemplate.lastModifiedBy
  if (outputTemplate.created) delete outputTemplate.created
  if (outputTemplate.lastModified) delete outputTemplate.lastModified

  // Write file to disk
  if (fs.existsSync(filePath)) {
    if (!force) {
      if (debug)
        process.stdout.write(chalk.gray(`${figures.cross} Skipping style file for ${displayTemplate.key} - File already exists\n`))
    } else {
      if (debug) {
        process.stdout.write(chalk.gray(`${figures.arrowRight} Overwriting style file for ${displayTemplate.key}\n`))
      }
      fs.writeFileSync(filePath, JSON.stringify(outputTemplate, undefined, 2))
      updated = true
    }
  } else {
    if (debug)
      process.stdout.write(chalk.gray(`${figures.arrowRight} Creating style file for ${displayTemplate.key} in ${filePath}\n`))
    fs.writeFileSync(filePath, JSON.stringify(outputTemplate, undefined, 2))
    updated = true
  }

  return updated;
}

export async function createDisplayTemplateHelper(typeFile: TypeFilesListEntry, typeFileId: string, force: boolean = false, debug: boolean = false) {
  const prefix = '//not-modified - Remove this line when making change to prevent it from being updated by the CLI tools'
  const { filePath: typeFilePath, templates } = typeFile

  const shouldWrite: boolean = await fsAsync.readFile(typeFilePath, { encoding: "utf-8" }).then(data => data.startsWith('//not-modified')).catch((e: any) => {
    if (e?.code === 'ENOENT')
      return true;
    if (debug)
      process.stdout.write(chalk.redBright(chalk.bold(`${figures.cross} Unexpected error while reading display template file\n`)))
    return false;
  })

  if (!shouldWrite) {
    if (!force) {
      if (debug)
        process.stdout.write(chalk.gray(`${figures.cross} Skipped writing definition file for ${typeFileId} - it already exists and has been modified\n`));
      return false;
    } else {
      if (debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Forcefully overwriting definition file for ${typeFileId} - ${typeFilePath}\n`))
    }
  } else if (debug)
    process.stdout.write(chalk.gray(`${figures.arrowRight} Creating or updating definition file for ${typeFileId} - ${typeFilePath}\n`))

  // Write Style definition
  const imports: string[] = [
    'import type { LayoutProps, LayoutPropsSettingKeys, LayoutPropsSettingValues, CmsComponentProps } from "@remkoj/optimizely-cms-react"',
    'import type { JSX, ComponentType } from "react"'
  ]
  const typeContents: string[] = []
  const props: string[] = []
  let typeId: string | undefined = typeFileId.split('/', 2)[1]
  templates.forEach(({ file: displayTemplateFile, data: displayTemplate }) => {
    const importPath = path.relative(path.dirname(typeFilePath), displayTemplateFile).replaceAll('\\', '/')
    imports.push(`import type ${displayTemplate.key}Styles from "./${importPath}"`)
    typeContents.push(`export type ${displayTemplate.key}Props = LayoutProps<typeof ${displayTemplate.key}Styles>`)
    typeContents.push(`export type ${displayTemplate.key}Keys = LayoutPropsSettingKeys<${displayTemplate.key}Props>`)
    typeContents.push(`export type ${displayTemplate.key}Options<K extends ${displayTemplate.key}Keys> = LayoutPropsSettingValues<${displayTemplate.key}Props, K>`)
    typeContents.push(`export type ${displayTemplate.key}ComponentProps<DT extends Record<string, unknown> = Record<string, unknown>> = Omit<CmsComponentProps<DT, ${displayTemplate.key}Props>,'children'> & JSX.IntrinsicElements['div']`)
    typeContents.push(`export type ${displayTemplate.key}Component<DT extends Record<string, unknown> = Record<string, unknown>> = ComponentType<${displayTemplate.key}ComponentProps<DT>>`)
    typeContents.push('')
    props.push(`${displayTemplate.key}Props`)
    if (!typeId)
      typeId = displayTemplate.nodeType ?? displayTemplate.baseType ?? displayTemplate.contentType
  })

  if (typeId) {
    typeId = ucFirst(typeId)
    typeContents.push(`export type ${typeId}LayoutProps = ${props.join(' | ')}
export type ${typeId}LayoutKeys = LayoutPropsSettingKeys<${typeId}LayoutProps>
export type ${typeId}LayoutOptions<K extends ${typeId}LayoutKeys> = LayoutPropsSettingValues<${typeId}LayoutProps,K>
export type ${typeId}ComponentProps<DT extends Record<string, unknown> = Record<string, unknown>> = Omit<CmsComponentProps<DT, ${typeId}LayoutProps>,'children'> & JSX.IntrinsicElements['div']
export type ${typeId}Component<DT extends Record<string, unknown> = Record<string, unknown>> = ComponentType<${typeId}ComponentProps<DT>>`)

    const defaultTemplate = templates.find(t => t.data.isDefault)
    if (defaultTemplate) {

      typeContents.push(`
export function isDefaultProps(props?: ${typeId}LayoutProps | null) : props is ${defaultTemplate.data?.key}Props
{
    return props?.template == "${defaultTemplate.data?.key}"
}`)
    }
    templates.forEach(t => {
      typeContents.push(`
export function is${t.data.key}Props(props?: ${typeId}LayoutProps | null) : props is ${t.data.key}Props
{
    return props?.template == "${t.data.key}"
}`)
    })
  }

  void await fsAsync.writeFile(typeFilePath, prefix + "\n" + imports.join("\n") + "\n\n" + typeContents.join("\n"))
  return true
}
