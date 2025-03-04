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

export async function getContentTypes(client: CmsApiClient, args: ArgumentsCamelCase<OptiCmsArgs<ContentTypesArgs>>, pageSize: number = 100, allowSystem: boolean = false): Promise<GetContentTypesResult> {
  const { _config: cfg, excludeBaseTypes, excludeTypes, baseTypes, types, all } = parseArgs(args)

  process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Pulling Content Types from Optimizely CMS\n`))

  if (cfg.debug)
    process.stdout.write(chalk.gray(`${figures.arrowRight} Fetching page 1 of ? (${pageSize} items per page)\n`))
  let resultsPage = await client.contentTypesList({ query: { pageIndex: 0, pageSize } })
  const results: (typeof resultsPage)["items"] = resultsPage.items ?? []
  let pagesRemaining = Math.ceil(resultsPage.totalItemCount / resultsPage.pageSize) - (resultsPage.pageIndex + 1)

  while (pagesRemaining > 0 && results.length < resultsPage.totalItemCount) {
    if (cfg.debug)
      process.stdout.write(chalk.gray(`${figures.arrowRight} Fetching page ${resultsPage.pageIndex + 2} of ${Math.ceil(resultsPage.totalItemCount / resultsPage.pageSize)} (${resultsPage.pageSize} items per page)\n`))
    resultsPage = await client.contentTypesList({ query: { pageIndex: resultsPage.pageIndex + 1, pageSize: resultsPage.pageSize } })
    results.push(...resultsPage.items)
    pagesRemaining = Math.ceil(resultsPage.totalItemCount / resultsPage.pageSize) - (resultsPage.pageIndex + 1)
  }

  if (cfg.debug) {
    process.stdout.write(chalk.gray(`${figures.arrowRight} Fetched ${results.length} Content-Types from Optimizely CMS\n`))
    process.stdout.write(chalk.gray(`${figures.arrowRight} Filtering Content-Types based upon arguments\n`))
  }

  const validBaseTypes = getEnumOptions(IntegrationApi.ContentBaseType).map(x => x.toLowerCase())
  const allContentTypes = all ?
    // If we're returning all content types, including non-supported base types, make sure the base type is always set
    results.map(contentType => {
      return {
        ...contentType,
        baseType: contentType.baseType ?? 'default'
      } as IntegrationApi.ContentType
    }) :
    // Otherwise filter out any non supported content base type
    results.filter(contentType => {
      const baseType = (contentType.baseType ?? 'default').toLowerCase()
      const isValid = validBaseTypes.includes(baseType)
      if (!isValid && cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Removing ${contentType.key} as it has an unsupported base type: ${baseType}\n`))
      return isValid
    })
  const contentTypes = allContentTypes.filter(data => {

    // Remove items based upon filters
    const keepType = (!excludeBaseTypes.includes(data.baseType)) &&
      (!excludeTypes.includes(data.key)) &&
      (baseTypes.length == 0 || baseTypes.includes(data.baseType)) &&
      (types.length == 0 || types.includes(data.key))
    if (!keepType) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Content-Type ${data.key} due to applied filters\n`))
      return false
    }

    // Skip system types if desired
    if (data.source == 'system' && !allowSystem) {
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping Content-Type ${data.key} due to it being a system type\n`))
      return false
    }
    return true
  })

  if (cfg.debug)
    process.stdout.write(chalk.gray(`${figures.arrowRight} Applied content type filters, reduced from ${results.length} to ${contentTypes.length} items\n`))

  return {
    all: allContentTypes,
    contentTypes: contentTypes
  }
}