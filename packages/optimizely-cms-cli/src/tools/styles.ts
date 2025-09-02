import type { OptiCmsArgs } from '../types.js'
import type { Argv, ArgumentsCamelCase } from 'yargs'
import { CmsIntegrationApiClient as CmsApiClient, IntegrationApi, OptiCmsVersion } from '@remkoj/optimizely-cms-api'
import { parseArgs } from '../tools/parseArgs.js'
import chalk from 'chalk'
import figures from 'figures'
import path from 'node:path'

import { ContentTypesArgs, contentTypesBuilder, getAllContentTypes } from './contentTypes.js'

export type StylesArgs = ContentTypesArgs & {
  excludeNodeTypes: string[]
  excludeTemplates: string[]
  nodes: string[]
  templates: string[]
  templateTypes: string[]
}

export const stylesBuilder: (yargs: Argv<OptiCmsArgs>) => Argv<OptiCmsArgs<StylesArgs>> = yargs => {
  const newArgs = contentTypesBuilder(yargs)
  newArgs.option('excludeNodeTypes', { alias: 'ent', description: "Exclude these node types", string: true, type: 'array', demandOption: false, default: [] })
  newArgs.option('excludeTemplates', { alias: 'et', description: "Exclude these templates", string: true, type: 'array', demandOption: false, default: ['folder', 'media', 'image', 'video'] })
  newArgs.option("nodes", { alias: 'n', description: "Select only these node types", string: true, type: 'array', demandOption: false, default: [] })
  newArgs.option("templates", { alias: 'd', description: "Select only these templates", string: true, type: 'array', demandOption: false, default: [] })
  newArgs.option("templateTypes", { alias: 'tt', description: "Select only these template types", choices: ['node', 'base', 'component'], type: 'array', demandOption: false, default: [] })
  return newArgs as Argv<OptiCmsArgs<StylesArgs>>
}

export type GetStylesResult = { all: Array<IntegrationApi.DisplayTemplate>, styles: Array<IntegrationApi.DisplayTemplate> }

export async function getStyles(client: CmsApiClient, args: ArgumentsCamelCase<OptiCmsArgs<StylesArgs>>, pageSize: number = 25): Promise<GetStylesResult> {
  if (client.runtimeCmsVersion == OptiCmsVersion.CMS12) return { all: [], styles: [] }
  const { _config: cfg, excludeBaseTypes, excludeTypes, excludeNodeTypes, excludeTemplates, baseTypes, types, nodes, templates, templateTypes } = parseArgs(args)

  process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Pulling Style-Definitions from Optimizely CMS\n`))

  const allDisplayTemplates: Array<IntegrationApi.DisplayTemplate> = []
  const filteredDisplayTemplates: Array<IntegrationApi.DisplayTemplate> = []

  for await (const displayTemplate of getAllStyles(client, cfg.debug, pageSize)) {
    allDisplayTemplates.push(displayTemplate)
    const templateType: string = displayTemplate.baseType ? 'base' : displayTemplate.nodeType ? 'node' : displayTemplate.contentType ? 'component' : 'unknown'

    if (isExcluded(displayTemplate.key, excludeTemplates, templates)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${displayTemplate.key} - Style defintion key filtering active\n`))
      continue
    }

    if (isExcluded(templateType, [], templateTypes)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${displayTemplate.key} - Style type filtering is active\n`))
      continue
    }
    if (displayTemplate.baseType && isExcluded(displayTemplate.baseType, excludeBaseTypes, baseTypes)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${displayTemplate.key} - Style is defined at base type level and base type filtering is active\n`))
      continue
    }
    if (displayTemplate.contentType && isExcluded(displayTemplate.contentType, excludeTypes, types)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${displayTemplate.key} - Style is defined at component type level and component type filtering is active\n`))
      continue
    }
    if (templateType != 'component' && types.length > 0) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${displayTemplate.key} - Style is targeting the ${templateType} level and component type selection is active\n`))
      continue
    }
    if (displayTemplate.nodeType && isExcluded(displayTemplate.nodeType, excludeNodeTypes, nodes)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${displayTemplate.key} - Style is defined at node type level and node type filtering is active\n`))
      continue
    }
    if (templateType != 'node' && nodes.length > 0) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${displayTemplate.key} - Style is targeting the ${templateType} level and node type selection is active\n`))
      continue
    }

    filteredDisplayTemplates.push(displayTemplate)
  }

  if (cfg.debug)
    process.stdout.write(chalk.gray(`${figures.arrowRight} Applied style filters, reduced from ${allDisplayTemplates.length} to ${filteredDisplayTemplates.length} items\n`))

  return {
    all: allDisplayTemplates,
    styles: filteredDisplayTemplates
  }
}

export async function* getAllStyles(client: CmsApiClient, debug: boolean = false, pageSize: number = 5): AsyncGenerator<IntegrationApi.DisplayTemplate, void, IntegrationApi.DisplayTemplate> {
  if (client.runtimeCmsVersion == OptiCmsVersion.CMS12) return;

  let requestPageSize = pageSize;
  let requestPageIndex = 0
  let totalItemCount = 0
  let totalPages = 0
  do {
    const resultsPage = await client.displayTemplatesList({ query: { pageIndex: requestPageIndex, pageSize: requestPageSize } }).catch((_) => {
      return {
        items: [],
        totalItemCount: 0,
        pageIndex: requestPageIndex,
        pageSize: requestPageSize
      } as IntegrationApi.DisplayTemplatePage
    });

    // Calculate fields for next page
    totalItemCount = resultsPage.totalItemCount ?? 0;
    requestPageSize = resultsPage.pageSize
    requestPageIndex = resultsPage.pageIndex + 1
    totalPages = Math.ceil(totalItemCount / requestPageSize)

    // Debug output
    if (debug)
      process.stdout.write(chalk.gray(`${figures.arrowRight} Fetched displayTemplates page ${requestPageIndex} of ${totalPages} (${requestPageSize} items per page)\n`))

    // Yield items
    for (const displayTemplate of (resultsPage.items ?? [])) {
      yield displayTemplate
    }

  } while (requestPageIndex < totalPages)
}

export async function getStylesOld(client: CmsApiClient, args: ArgumentsCamelCase<OptiCmsArgs<StylesArgs>>, pageSize: number = 100): Promise<GetStylesResult> {
  if (client.runtimeCmsVersion == OptiCmsVersion.CMS12) return { all: [], styles: [] }
  const { _config: cfg, excludeBaseTypes, excludeTypes, excludeNodeTypes, excludeTemplates, baseTypes, types, nodes, templates, templateTypes } = parseArgs(args)

  process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Pulling Style-Definitions from Optimizely CMS\n`))

  if (cfg.debug)
    process.stdout.write(chalk.gray(`${figures.arrowRight} Fetching page 1 of ? (${pageSize} items per page)\n`))
  let resultsPage = await client.displayTemplatesList({ query: { pageIndex: 0, pageSize } })
  const results: (typeof resultsPage)["items"] = resultsPage.items ?? []
  let pagesRemaining = Math.ceil(resultsPage.totalItemCount / resultsPage.pageSize) - (resultsPage.pageIndex + 1)

  while (pagesRemaining > 0 && results.length < resultsPage.totalItemCount) {
    if (cfg.debug)
      process.stdout.write(chalk.gray(`${figures.arrowRight} Fetching page ${resultsPage.pageIndex + 2} of ${Math.ceil(resultsPage.totalItemCount / resultsPage.pageSize)} (${resultsPage.pageSize} items per page)\n`))
    resultsPage = await client.displayTemplatesList({ query: { pageIndex: resultsPage.pageIndex + 1, pageSize: resultsPage.pageSize } })
    results.push(...resultsPage.items)
    pagesRemaining = Math.ceil(resultsPage.totalItemCount / resultsPage.pageSize) - (resultsPage.pageIndex + 1)
  }

  if (cfg.debug) {
    process.stdout.write(chalk.gray(`${figures.arrowRight} Fetched ${results.length} Style-Definitions from Optimizely CMS\n`))
    process.stdout.write(chalk.gray(`${figures.arrowRight} Filtering Style-Definitions based upon arguments\n`))
  }

  const styles = results.filter(data => {
    if (isExcluded(data.key, excludeTemplates, templates)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${data.key} - Style defintion key filtering active\n`))
      return false
    }
    const templateType: string = data.baseType ? 'base' : data.nodeType ? 'node' : data.contentType ? 'component' : 'unknown'
    if (isExcluded(templateType, [], templateTypes)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${data.key} - Style type filtering is active\n`))
      return false
    }
    if (data.baseType && isExcluded(data.baseType, excludeBaseTypes, baseTypes)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${data.key} - Style is defined at base type level and base type filtering is active\n`))
      return false
    }
    if (data.contentType && isExcluded(data.contentType, excludeTypes, types)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${data.key} - Style is defined at component type level and component type filtering is active\n`))
      return false
    }
    if (templateType != 'component' && types.length > 0) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${data.key} - Style is targeting the ${templateType} level and component type selection is active\n`))
      return false
    }
    if (data.nodeType && isExcluded(data.nodeType, excludeNodeTypes, nodes)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${data.key} - Style is defined at node type level and node type filtering is active\n`))
      return false
    }
    if (templateType != 'node' && nodes.length > 0) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${data.key} - Style is targeting the ${templateType} level and node type selection is active\n`))
      return false
    }
    return true
  })

  if (cfg.debug)
    process.stdout.write(chalk.gray(`${figures.arrowRight} Applied content type filters, reduced from ${results.length} to ${styles.length} items\n`))

  return {
    all: results,
    styles
  }
}

function isExcluded<T>(value: T, exclusions: Array<T>, inclusions: Array<T>): boolean {
  if (value == undefined || value == null)
    return false
  return exclusions.includes(value) || (inclusions.length > 0 && !inclusions.includes(value))
}

export async function getStyleFilePath(definition: IntegrationApi.DisplayTemplate, opts?: { contentBaseType?: IntegrationApi.ContentType['baseType'], client?: CmsApiClient }): Promise<string> {
  if (definition.nodeType)
    return `nodes/${definition.nodeType}/${definition.key}/${definition.key}.opti-style.json`
  if (definition.baseType)
    return `${definition.baseType}/styles/${definition.key}/${definition.key}.opti-style.json`
  if (definition.contentType) {
    if (opts?.contentBaseType)
      return `${opts?.contentBaseType}/${definition.contentType}/${definition.key}.opti-style.json`

    if (!opts?.client)
      throw new Error("Neither the contentBaseType, nor the ApiClient has been provided for a definition for a specific ContentType - unable to generate the path")

    const contentType: IntegrationApi.ContentType | undefined = await opts.client.contentTypesGet({ path: { key: definition.contentType } }).catch(() => undefined)
    if (contentType)
      return `${contentType.baseType}/${definition.contentType}/${definition.key}.opti-style.json`

  }
  throw new Error(`Unable to resolve the target for the DisplayTemplate: ${definition.key}`)
}

export type StyleFilePaths = {
  /**
   * Folder of the style definition file
   */
  itemFile: string
  /**
   * Folder for the style defintion
   */
  itemPath: string
  /**
   * Folder for the displayTemplates.ts file
   */
  typesPath: string
  /**
   * Textual identifier of the style definition
   */
  targetType: string
}

export async function getStyleFilePaths(definition: IntegrationApi.DisplayTemplate, opts?: { contentBaseType?: IntegrationApi.ContentType['baseType'], client?: CmsApiClient }): Promise<StyleFilePaths> {
  if (definition.nodeType)
    return {
      itemFile: path.join('nodes', definition.nodeType, definition.key, definition.key + '.opti-style.json'),
      itemPath: path.join('nodes', definition.nodeType, definition.key),
      typesPath: path.join('nodes', definition.nodeType),
      targetType: 'node/' + definition.nodeType
    }

  if (definition.baseType)
    return {
      itemFile: path.join(definition.baseType, 'styles', definition.key, definition.key + '.opti-style.json'),
      itemPath: path.join(definition.baseType, 'styles', definition.key),
      typesPath: path.join(definition.baseType, 'styles'),
      targetType: 'base/' + definition.baseType
    }

  if (definition.contentType) {
    if (opts?.contentBaseType)
      return {
        itemFile: path.join(opts.contentBaseType, definition.contentType, definition.key + '.opti-style.json'),
        itemPath: path.join(opts.contentBaseType, definition.contentType),
        typesPath: path.join(opts.contentBaseType, definition.contentType),
        targetType: 'content/' + definition.contentType
      }

    if (!opts?.client)
      throw new Error("Neither the contentBaseType, nor the ApiClient has been provided for a definition for a specific ContentType - unable to generate the path")

    const contentType: IntegrationApi.ContentType | undefined = await opts.client.contentTypesGet({ path: { key: definition.contentType } }).catch(() => undefined)
    if (contentType)
      return {
        itemFile: path.join(contentType.baseType, definition.contentType, definition.key + '.opti-style.json'),
        itemPath: path.join(contentType.baseType, definition.contentType),
        typesPath: path.join(contentType.baseType, definition.contentType),
        targetType: 'content/' + definition.contentType
      }
  }
  throw new Error(`Unable to resolve the target for the DisplayTemplate: ${definition.key}`)
}