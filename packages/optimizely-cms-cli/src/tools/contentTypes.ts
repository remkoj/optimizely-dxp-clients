import type { OptiCmsArgs } from '../types.js'
import type { Argv, ArgumentsCamelCase } from 'yargs'
import { IntegrationApi, type CmsIntegrationApiClient as CmsApiClient } from '@remkoj/optimizely-cms-api'
import { parseArgs } from '../tools/parseArgs.js'
import chalk from 'chalk'
import figures from 'figures'

export type ContentTypesArgs = {
  excludeBaseTypes: string[]
  excludeTypes: string[]
  baseTypes: string[]
  types: string[]
  all: boolean
}

export const contentTypesBuilder: (yargs: Argv<OptiCmsArgs>) => Argv<OptiCmsArgs<ContentTypesArgs>> = yargs => {
  yargs.option('excludeTypes', { alias: 'ect', description: "Exclude these content types", string: true, type: 'array', demandOption: false, default: [] })
  yargs.option('excludeBaseTypes', { alias: 'ebt', description: "Exclude these base types", string: true, type: 'array', demandOption: false, default: ['folder', 'media', 'image', 'video'] })
  yargs.option("baseTypes", { alias: 'b', description: "Select only these base types", string: true, type: 'array', demandOption: false, default: [] })
  yargs.option("types", { alias: 't', description: "Select only these types", string: true, type: 'array', demandOption: false, default: [] })
  yargs.option('all', { alias: 'a', description: "Include non-supported base types", boolean: true, type: 'boolean', demandOption: false, default: false })
  return yargs as Argv<OptiCmsArgs<ContentTypesArgs>>
}

export type GetContentTypesResult = { all: Array<IntegrationApi.ContentType>, contentTypes: Array<IntegrationApi.ContentType> }

function getEnumOptions<T extends object>(enumObject: T): Array<keyof T> {
  return (Object.keys(enumObject) as Array<keyof T>).filter((item) => {
    return isNaN(Number(item));
  });
}

export async function getContentTypes(
  client: CmsApiClient,
  args: ArgumentsCamelCase<OptiCmsArgs<ContentTypesArgs>>,
  pageSize: number = 5,
  allowSystem: boolean = false,
  customFilter?: (currentType: IntegrationApi.ContentType) => boolean | Promise<boolean>
): Promise<GetContentTypesResult> {
  const { _config: cfg, excludeBaseTypes, excludeTypes, baseTypes, types, all } = parseArgs(args)

  const validBaseTypes = getEnumOptions(IntegrationApi.ContentBaseType).map(x => x.toLowerCase())
  const allContentTypes: Array<IntegrationApi.ContentType> = []
  const filteredContentTypes: Array<IntegrationApi.ContentType> = []

  for await (const contentType of getAllContentTypes(client, cfg.debug, pageSize)) {
    const normalizedContentType = { ...contentType, baseType: contentType.baseType ?? 'default' as IntegrationApi.ContentBaseType }

    // Build the "All" data set
    if (all)
      allContentTypes.push(normalizedContentType)
    else if (validBaseTypes.includes(normalizedContentType.baseType.toLowerCase()))
      allContentTypes.push(normalizedContentType)
    else if (cfg.debug) {
      process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${normalizedContentType.key} as it has an unsupported base type: ${normalizedContentType.baseType}\n`))
      continue
    } else {
      continue
    }

    // Skip based upon base type filters
    if (!shouldInclude(normalizedContentType.baseType, baseTypes, excludeBaseTypes)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${normalizedContentType.key} as it has a restricted base type: ${normalizedContentType.baseType}\n`))
      continue
    }

    // Skip based upon type filters
    if (!shouldInclude(normalizedContentType.key, types, excludeTypes)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${normalizedContentType.key} as it has a restricted type: ${normalizedContentType.key}\n`))
      continue
    }

    // Skip based upon system filter
    if (normalizedContentType.source == 'system' && !allowSystem) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Content-Type ${normalizedContentType.key} due to it being a system type\n`))
      continue
    }

    // Skip based upon custom filter
    if (customFilter && !await customFilter(normalizedContentType)) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Content-Type ${normalizedContentType.key} due to the custom filter\n`))
      continue
    }

    // Add to list
    filteredContentTypes.push(normalizedContentType)
  }

  if (cfg.debug)
    process.stdout.write(chalk.gray(`${figures.arrowRight} Applied content type filters, reduced from ${allContentTypes.length} to ${filteredContentTypes.length} items\n`))

  return { all: allContentTypes, contentTypes: filteredContentTypes }
}

function shouldInclude<T>(value: T, allow?: T[] | null, disallow?: T[] | null) {
  // Item is allowed when either allow is not set, an empty array or has the value
  const isAllowed = !Array.isArray(allow) || allow.length === 0 || allow.includes(value);
  // Item is disallowed when and the array is set and includes the value
  const isDisallowed = Array.isArray(disallow) && disallow.includes(value);

  return isAllowed && !isDisallowed
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
  let requestPageIndex = 0
  let totalItemCount = 0
  let totalPages = 0
  do {
    const resultsPage = await client.contentTypesList({ query: { pageIndex: requestPageIndex, pageSize: requestPageSize } }).catch((_) => {
      return {
        items: [],
        totalItemCount: 0,
        pageIndex: requestPageIndex,
        pageSize: requestPageSize
      } as IntegrationApi.ContentTypePage
    });

    // Calculate fields for next page
    totalItemCount = resultsPage.totalItemCount ?? 0;
    requestPageSize = resultsPage.pageSize
    requestPageIndex = resultsPage.pageIndex + 1
    totalPages = Math.ceil(totalItemCount / requestPageSize)

    // Debug output
    if (debug)
      process.stdout.write(chalk.gray(`${figures.arrowRight} Fetched contentTypes page ${requestPageIndex} of ${totalPages} (${requestPageSize} items per page)\n`))

    // Yield items
    for (const contentType of (resultsPage.items ?? [])) {
      yield contentType
    }

  } while (requestPageIndex < totalPages)
}