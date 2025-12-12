import type { CliModule } from '../types.js'
import { parseArgs } from '../tools/parseArgs.js'
import { type IntegrationApi, type ApiClientInstance, OptiCmsVersion } from '@remkoj/optimizely-cms-api'
import chalk from 'chalk'
import figures from 'figures'
import fs from 'node:fs'
import path from 'node:path'
import fsAsync from 'node:fs/promises'

import { createCmsClient } from '../tools/cmsClient.js'
import { StylesArgs, stylesBuilder, getStyles } from '../tools/styles.js'

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
    if (client.runtimeCmsVersion == OptiCmsVersion.CMS12) {
      process.stdout.write(chalk.gray(`${figures.cross} Styles are not supported on CMS12\n`))
      return
    }

    const { styles: filteredResults } = await getStyles(client, args)

    //#region Create & Write opti-style.json files
    process.stdout.write(chalk.gray(`${figures.arrowRight} Start creating .opti-style.json files\n`))
    const typeFiles: TypeFilesList = {}
    const updatedTemplates = (await Promise.all(filteredResults.map(async displayTemplate => {
      // Create metadata
      const { targetType, styleFilePath: filePath, helperFilePath: helperPath } = await createTemplateMetadata(client, displayTemplate, basePath, true);

      // Build local style data
      const outputTemplate = { ...displayTemplate }
      if (outputTemplate.createdBy) delete outputTemplate.createdBy
      if (outputTemplate.lastModifiedBy) delete outputTemplate.lastModifiedBy
      if (outputTemplate.created) delete outputTemplate.created
      if (outputTemplate.lastModified) delete outputTemplate.lastModified

      // Write file to disk
      if (fs.existsSync(filePath)) {
        if (!force) {
          if (cfg.debug)
            process.stdout.write(chalk.gray(`${figures.cross} Skipping style file for ${displayTemplate.key} - File already exists\n`))
        } else {
          if (cfg.debug) {
            process.stdout.write(chalk.gray(`${figures.arrowRight} Overwriting style file for ${displayTemplate.key}\n`))
          }
          fs.writeFileSync(filePath, JSON.stringify(outputTemplate, undefined, 2))
        }
      } else {
        if (cfg.debug)
          process.stdout.write(chalk.gray(`${figures.arrowRight} Creating style file for ${displayTemplate.key} in ${filePath}\n`))
        fs.writeFileSync(filePath, JSON.stringify(outputTemplate, undefined, 2))
      }

      // Ensure we're tracking all files
      if (!typeFiles[targetType]) {
        typeFiles[targetType] = {
          filePath: helperPath,
          templates: []
        }
      }
      typeFiles[targetType].templates.push({ key: displayTemplate.key, file: filePath, data: displayTemplate })

      return displayTemplate.key
    }))).filter(x => x)
    //#endregion

    //#region Create needed definition files
    if (definitions)
      await createDisplayTemplateHelpers(typeFiles)
    //#endregion

    process.stdout.write(chalk.green(chalk.bold(figures.tick + ` Created/updated style definitions for ${updatedTemplates.join(', ')}`)) + "\n")
  }
}
export default StylesPullCommand

export type TypeFilesListEntry = { templates: Array<{ key: string, file: string, data: IntegrationApi.DisplayTemplate }>, filePath: string }
export type TypeFilesList = Record<string, TypeFilesListEntry>

function ucFirst(input: string) {
  if (typeof (input) != 'string' || input.length < 1)
    return input
  return input[0].toUpperCase() + input.substring(1)
}

export function toTypeFilesList(client: ApiClientInstance, templates: IntegrationApi.DisplayTemplate[], basePath: string, createPaths: boolean = true) {
  return templates.reduce(async (prevList, displayTemplate) => {
    const typeFiles = await prevList;
    const { targetType, styleFilePath: filePath, helperFilePath: helperPath } = await createTemplateMetadata(client, displayTemplate, basePath, createPaths)
    if (!typeFiles[targetType]) {
      typeFiles[targetType] = {
        filePath: helperPath,
        templates: []
      }
    }
    typeFiles[targetType].templates.push({ key: displayTemplate.key, file: filePath, data: displayTemplate })
    return typeFiles
  }, Promise.resolve({} as TypeFilesList))
}

export async function createTemplateMetadata(client: ApiClientInstance, displayTemplate: IntegrationApi.DisplayTemplate, basePath: string, createPaths: boolean = true): Promise<{
  key: string
  /**
   * The folder where the *.opti-style.json file must be stored for this display template
   */
  itemPath: string
  /**
   * The folder where the displayTemplates.ts file must be stored for this display template
   */
  typesPath: string
  /**
   * The target identifier of this 
   */
  targetType: string
  /**
   * The full path of the *.opti-style.json file of this display template
   */
  styleFilePath: string
  /**
   * The full path of the displayTemplates.ts file of this display template
   */
  helperFilePath: string
}> {
  let itemPath: string | undefined = undefined
  let targetType: string
  let typesPath: string
  const targetPrefix = getTemplateTarget(displayTemplate)
  switch (targetPrefix) {
    case 'node':
      itemPath = path.join(basePath, 'nodes', displayTemplate.nodeType, displayTemplate.key);
      typesPath = path.join(basePath, 'nodes', displayTemplate.nodeType);
      targetType = targetPrefix + '/' + displayTemplate.nodeType;
      break;
    case 'base':
      itemPath = path.join(basePath, displayTemplate.baseType, 'styles', displayTemplate.key);
      typesPath = path.join(basePath, displayTemplate.baseType, 'styles');
      targetType = targetPrefix + '/' + displayTemplate.baseType;
      break;
    case 'content':
      const contentType = await client.contentTypes.contentTypesGet(displayTemplate.contentType ?? '-')
      itemPath = path.join(basePath, contentType.baseType, contentType.key.replaceAll(':','_'))
      typesPath = path.join(basePath, contentType.baseType, contentType.key.replaceAll(':','_'))
      targetType = targetPrefix + '/' + displayTemplate.contentType
      break;
    default:
      throw new Error("Unsupported display template type")
  }

  if (createPaths)
    void await fsAsync.mkdir(itemPath, { recursive: true }).catch(e => {
      console.log(e)
    })

  const styleFilePath = path.join(itemPath, `${displayTemplate.key}.opti-style.json`)
  const helperFilePath = path.join(typesPath, 'displayTemplates.ts')

  return { key: displayTemplate.key, itemPath, typesPath, targetType, styleFilePath, helperFilePath }
}

export function getTemplateTarget(displayTemplate: IntegrationApi.DisplayTemplate): 'base' | 'node' | 'content' | null {
  if (displayTemplate.baseType && displayTemplate.baseType.length > 0)
    return 'base'
  if (displayTemplate.nodeType && displayTemplate.nodeType.length > 0)
    return 'node'
  if (displayTemplate.contentType && displayTemplate.contentType.length > 0)
    return 'content'
  return null
}

export async function createDisplayTemplateHelpers(typeFiles: TypeFilesList, force: boolean = false, debug: boolean = false) {
  process.stdout.write(chalk.gray(`${figures.arrowRight} Start creating displayTemplates.ts files\n`))
  for (const targetId in typeFiles) {
    await createDisplayTemplateHelper(typeFiles[targetId], targetId, force, debug)
  }
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
    'import type { LayoutProps } from "@remkoj/optimizely-cms-react"',
    'import type { ReactNode } from "react"'
  ]
  const typeContents: string[] = []
  const props: string[] = []
  let typeId: string | undefined = typeFileId.split('/', 2)[1]
  templates.forEach(({ file: displayTemplateFile, data: displayTemplate }) => {
    const importPath = path.relative(path.dirname(typeFilePath), displayTemplateFile).replaceAll('\\', '/')
    imports.push(`import type ${displayTemplate.key}Styles from "./${importPath}"`)
    typeContents.push(`export type ${displayTemplate.key}Props = LayoutProps<typeof ${displayTemplate.key}Styles>`)
    typeContents.push(`export type ${displayTemplate.key}ComponentProps<DT extends Record<string, any> = Record<string, any>> = {
    data: DT
    layoutProps: ${displayTemplate.key}Props | undefined
} & JSX.IntrinsicElements['div']`)
    typeContents.push(`export type ${displayTemplate.key}Component<DT extends Record<string, any> = Record<string, any>> = (props: ${displayTemplate.key}ComponentProps<DT>) => ReactNode`)
    typeContents.push('')
    props.push(`${displayTemplate.key}Props`)
    if (!typeId)
      typeId = displayTemplate.nodeType ?? displayTemplate.baseType ?? displayTemplate.contentType
  })

  if (typeId) {
    typeId = ucFirst(typeId)
    typeContents.push('')
    typeContents.push(`export type ${typeId}LayoutProps = ${props.join(' | ')}
export type ${typeId}ComponentProps<DT extends Record<string, any> = Record<string, any>, LP extends ${typeId}LayoutProps = ${typeId}LayoutProps> = {
    data: DT
    layoutProps: LP | undefined
} & JSX.IntrinsicElements['div']

export type ${typeId}Component<DT extends Record<string, any> = Record<string, any>, LP extends ${typeId}LayoutProps = ${typeId}LayoutProps> = (props: ${typeId}ComponentProps<DT,LP>) => ReactNode`)

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
