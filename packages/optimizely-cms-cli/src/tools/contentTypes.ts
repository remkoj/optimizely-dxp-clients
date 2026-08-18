import type { OptiCmsArgs } from '../types.js'
import type { Argv, ArgumentsCamelCase } from 'yargs'
import { IntegrationApi, type CmsIntegrationApiClient as CmsApiClient } from '@remkoj/optimizely-cms-api'
import { parseArgs } from '../tools/parseArgs.js'
import chalk from 'chalk'
import figures from 'figures'
import { shouldInclude, isContract, isGraphType, isFolder, isSystemType } from './filters.js'

export type ContentTypesArgs = {
  excludeBaseTypes: string[]
  excludeTypes: string[]
  baseTypes: string[]
  types: string[]
  all: boolean
}

export const ContentTypesArgsDefaults: Readonly<ContentTypesArgs> = {
  excludeBaseTypes: ['folder', 'media', 'image', 'video'],
  excludeTypes: [],
  baseTypes: [],
  types: [],
  all: false
}

export const contentTypesBuilder: (yargs: Argv<OptiCmsArgs>, defaults?: ContentTypesArgs) => Argv<OptiCmsArgs<ContentTypesArgs>> = (yargs, defaults = ContentTypesArgsDefaults) => {
  yargs.option('excludeTypes', { alias: 'ect', description: "Exclude these content types", string: true, type: 'array', demandOption: false, default: defaults.excludeTypes })
  yargs.option('excludeBaseTypes', { alias: 'ebt', description: "Exclude these base types", string: true, type: 'array', demandOption: false, default: defaults.excludeBaseTypes })
  yargs.option("baseTypes", { alias: 'b', description: "Select only these base types", string: true, type: 'array', demandOption: false, default: defaults.baseTypes })
  yargs.option("types", { alias: 't', description: "Select only these types", string: true, type: 'array', demandOption: false, default: defaults.types })
  yargs.option('all', { alias: 'a', description: "Include non-supported base types", boolean: true, type: 'boolean', demandOption: false, default: defaults.all })
  return yargs as Argv<OptiCmsArgs<ContentTypesArgs>>
}

export type GetContentTypesResult = { all: Array<IntegrationApi.ContentType>, contentTypes: Array<IntegrationApi.ContentType> }


export async function getContentTypes(
  client: CmsApiClient,
  args: ArgumentsCamelCase<OptiCmsArgs<ContentTypesArgs>>,
  pageSize: number = 25,
  allowSystem: boolean = false,
  customFilter?: (currentType: IntegrationApi.ContentType) => boolean | Promise<boolean>
): Promise<GetContentTypesResult> {
  const { _config: cfg, excludeBaseTypes, excludeTypes, baseTypes, types, all } = parseArgs(args)
  const allContentTypes: Array<IntegrationApi.ContentType> = []
  const filteredContentTypes: Array<IntegrationApi.ContentType> = []

  for await (const contentType of getAllContentTypes(client, cfg.debug, pageSize)) {
    // Skip contracts by default as they're abstract classes and cannot be used to directly store data.
    if (!all && isContract(contentType)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${contentType.key || contentType.displayName || "unnamed type"} as it is a contract and cannot be instantiated directly, use --all to include\n`))
      continue
    }

    // Skip content types mapped against Graph data, these should be used with their source type in Graph, 
    // not the reference in CMS
    if (!all && isGraphType(contentType)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${contentType.key} as it is a reference to external data in Optimizely Graph, use --all to include\n`))
      continue
    }

    // Skip folder types as these are non-data carrying types in the instance.
    if (!all && isFolder(contentType)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${contentType.key} as it is a folder, use --all to include\n`))
      continue
    }

    // Build the unfiltered array
    allContentTypes.push(contentType)

    // Skip based upon base type filters
    if (!shouldInclude(contentType.baseType, baseTypes, excludeBaseTypes, true)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${contentType.key} as it has a restricted base type: ${contentType.baseType}\n`))
      continue
    }

    // Skip based upon type filters
    if (!shouldInclude(contentType.key, types, excludeTypes, true)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${contentType.key} as it is a restricted type (${types.join(', ')})(${excludeTypes.join(', ')})\n`))
      continue
    }

    // Skip based upon system filter
    if (!allowSystem && isSystemType(contentType)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Content-Type ${contentType.key} due to it being a system type\n`))
      continue
    }

    // Skip based upon custom filter
    if (customFilter && !await customFilter(contentType)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Content-Type ${contentType.key} due to the custom filter\n`))
      continue
    }

    // Add to list
    filteredContentTypes.push(contentType)
  }

  if (cfg.debug)
    process.stdout.write(chalk.gray(`${figures.arrowRight} Applied content type filters, reduced from ${allContentTypes.length} to ${filteredContentTypes.length} items\n`))

  return { all: allContentTypes, contentTypes: filteredContentTypes }
}

/**
 * Retrieve all content types as an Async Generator, allowing processing of entries whilest they are being loaded from the CMS instance.
 * 
 * @param client 
 * @param args 
 * @param pageSize 
 */
export async function* getAllContentTypes(client: CmsApiClient, debug: boolean = false, pageSize: number = 25): AsyncGenerator<IntegrationApi.ContentType, void, IntegrationApi.ContentType> {
  process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Pulling Content Types from Optimizely CMS\n`))

  let requestPageSize = pageSize;
  let requestPageIndex = 0;
  let totalItemCount: number;
  let totalPages: number;
  do {
    const resultsPage = await client.contentTypesList({ query: { pageIndex: requestPageIndex, pageSize: requestPageSize } }).catch(() => {
      return {
        items: [],
        totalItemCount: 0,
        totalCount: 0,
        pageIndex: requestPageIndex,
        pageSize: requestPageSize
      } as IntegrationApi.ContentTypePage
    });

    // Calculate fields for next page
    //@ts-expect-error  There's a difference between the SaaS & PaaS API, hence we're ignoring the next line
    totalItemCount = resultsPage.totalItemCount ?? resultsPage.totalCount ?? 0;
    requestPageSize = resultsPage.pageSize
    requestPageIndex = resultsPage.pageIndex + 1
    totalPages = Math.ceil(totalItemCount / requestPageSize)

    // Debug output
    if (debug)
      process.stdout.write(chalk.gray(`${figures.arrowRight} Fetched contentTypes page ${requestPageIndex} of ${totalPages} (${requestPageSize} items per page, ${ totalItemCount } items available)\n`))

    // Yield items
    for (const contentType of (resultsPage.items ?? [])) {
      yield contentType
    }

  } while (requestPageIndex < totalPages)
}
