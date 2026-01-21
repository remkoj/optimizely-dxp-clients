import type { OptiCmsArgs } from '../types.js'
import type { Argv, ArgumentsCamelCase } from 'yargs'
import { ApiClientInstance, CmsIntegrationApiClient as CmsApiClient,type IntegrationApi } from '@remkoj/optimizely-cms-api'
import { parseArgs } from '../tools/parseArgs.js'
import chalk from 'chalk'
import figures from 'figures'
import { shouldInclude, isNonEmptyArray, isDefined } from './filters.js'

import { ContentTypesArgs, contentTypesBuilder } from './contentTypes.js'
import { getStyleFilePathsSync, StyleFilePaths, getDisplayTemplateType } from './project.js'

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
  const { 
    _config: cfg, 
    excludeBaseTypes: disallowBaseTypes, 
    excludeTypes: disallowTypes, 
    excludeNodeTypes: disallowNodeTypes, 
    excludeTemplates: disallowTemplates, 
    baseTypes: allowBaseTypes,
    types: allowTypes,
    nodes: allowNodeTypes,
    templates: allowTemplates,
    templateTypes: baseAllowTemplateTypes
  } = parseArgs(args)

  process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Pulling Style-Definitions from Optimizely CMS\n`))

  const allowTemplateTypes: string[] = [];
  if (!Array.isArray(baseAllowTemplateTypes) || baseAllowTemplateTypes.length === 0) {
    if (isNonEmptyArray(allowBaseTypes)) {
      console.log('BT', allowBaseTypes)
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Base picking filter is active, adjusting template type filter to pick templates targeting a base type\n`));
      allowTemplateTypes.push('base')
    }
    if (isNonEmptyArray(allowNodeTypes)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Node type filter active, adjusting template type filter\n`));
      allowTemplateTypes.push('node')
    }
    if (isNonEmptyArray(allowTypes)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Component type filter active, adjusting template type filter\n`));
      allowTemplateTypes.push('component')
    }
  } else {
    allowTemplateTypes.push(...baseAllowTemplateTypes);
  }

  const allDisplayTemplates: Array<IntegrationApi.DisplayTemplate> = []
  const filteredDisplayTemplates: Array<IntegrationApi.DisplayTemplate> = []

  for await (const displayTemplate of getAllStyles(client, cfg.debug, pageSize)) {
    allDisplayTemplates.push(displayTemplate)
    const templateType = getDisplayTemplateType(displayTemplate)

    if (!shouldInclude(displayTemplate.key, allowTemplates, disallowTemplates)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${displayTemplate.key} - Style defintion key filtering active\n`))
      continue
    }
    if (!shouldInclude(templateType, allowTemplateTypes)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${displayTemplate.key} - Style type filtering is active\n`))
      continue
    }
    if (templateType === 'base' && !shouldInclude(displayTemplate.baseType, allowBaseTypes, disallowBaseTypes)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${displayTemplate.key} - Style is defined at base type level and base type filtering is active\n`))
      continue
    }
    if (templateType === 'component' && !shouldInclude(displayTemplate.contentType, allowTypes, disallowTypes)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${displayTemplate.key} - Style is defined at component type level and component type filtering is active\n`))
      continue
    }
    if (templateType === 'node' && !shouldInclude(displayTemplate.nodeType, allowNodeTypes, disallowNodeTypes)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Style-Defintion ${displayTemplate.key} - Style is defined at node type level and node type filtering is active\n`))
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

export type TypeFilesListEntry = { templates: Array<{ key: string, file: string, data: IntegrationApi.DisplayTemplate, folder: string }>, filePath: string, fileFolder: string }
export class TypeFilesList extends Map<string, TypeFilesListEntry> {
  getDisplayTemplateByKey(displayTemplateKey: string): IntegrationApi.DisplayTemplate | undefined
  {
    for (const groupKey of this.keys()) {
      const templates = this.get(groupKey)?.templates || [];
      const displayTemplate = templates.find(x => x.key === displayTemplateKey)
      if (displayTemplate)
        return displayTemplate.data
    }
    return undefined
  }
  getDisplayTemplatePathsByKey(displayTemplateKey: string): StyleFilePaths | undefined
  {
    for (const identifier of this.keys()) {
      const groupInfo = this.get(identifier);
      const templates = groupInfo?.templates || [];
      const helperFile = groupInfo?.filePath;
      const helperFolder = groupInfo?.fileFolder;
      const info = templates.find(x => x.key === displayTemplateKey)
      if (info)
        return {
          styleFile: info.file,
          styleFolder: info.folder,
          identifier,
          helperFile,
          helperFolder
        }
    }
    return undefined
  }
}

export async function toTypeFilesList(displayTemplates: Array<IntegrationApi.DisplayTemplate>, client: ApiClientInstance, basePath: string) : Promise<TypeFilesList>
{
  if (isNonEmptyArray(displayTemplates)) {
    // Get all content types we need to get the type file lists
    const targetContentTypes = (await Promise.allSettled(displayTemplates.map(async displayTemplate => {
      if (!displayTemplate.contentType) return undefined;
      return client.contentTypesGet({ path: { key: displayTemplate.contentType }})
    }))).map(x => x.status == 'fulfilled' ? x.value : undefined).filter(isDefined);

    // Simple helper to get the base type from the list
    function getBaseTypeOf(contentTypeKey?: string | null): string | undefined
    {
      if (!contentTypeKey) return undefined;
      return targetContentTypes.find(x => x.key === contentTypeKey)?.baseType;
    }
    
    // Now reduce the list into the Map we need
    return displayTemplates.reduce((aggregator, displayTemplate) => {
      const contentTypeBaseType = getBaseTypeOf(displayTemplate.contentType);
      const { identifier, helperFile, helperFolder, styleFile, styleFolder } = getStyleFilePathsSync(displayTemplate, contentTypeBaseType, basePath, true);
      const info = aggregator.get(identifier) ?? { filePath: helperFile, fileFolder: helperFolder, templates: [] };
      info.templates.push({ key: displayTemplate.key, file: styleFile, data: displayTemplate, folder: styleFolder });
      aggregator.set(identifier, info);
      return aggregator;
    }, new TypeFilesList());
  } 
    
  return new TypeFilesList()
}
