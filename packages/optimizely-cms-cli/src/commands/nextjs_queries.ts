import { IntegrationApi, OptiCmsVersion } from '@remkoj/optimizely-cms-api'
import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'

import { parseArgs } from '../tools/parseArgs.js'
import { createCmsClient } from '../tools/cmsClient.js'
import { getContentTypes, contentTypesBuilder, ContentTypesArgsDefaults, type GetContentTypesResult } from '../tools/contentTypes.js'
import { type NextJsModule, createTypeFolders, getTypeFolder, type TypeFolderList } from './_nextjs_base.js'
import { renderProperties, createInitialFragment } from './nextjs_fragments.js'

/**
 * Keep track of all generated properties
 */
let generatedProps: Array<{ propType: string, propName: string }> = []

export const NextJsQueriesCommand: NextJsModule<{ loadedContentTypes: GetContentTypesResult, createdTypeFolders: TypeFolderList }> = {
  command: "nextjs:queries",
  describe: "Create the GrapQL Queries to use two queries to load content",
  builder: yargs => {
    const updatedArgs = contentTypesBuilder(yargs, { ...ContentTypesArgsDefaults, baseTypes: ['page', 'experience'] })
    updatedArgs.option('force', { alias: 'f', description: "Overwrite existing files", boolean: true, type: 'boolean', demandOption: false, default: false })
    return updatedArgs
  },
  handler: async (args, opts) => {
    generatedProps = []
    // Prepare
    const { loadedContentTypes, createdTypeFolders } = opts || {}
    const { components: basePath, _config: { debug }, force } = parseArgs(args)
    const client = createCmsClient(args)
    const { contentTypes, all: allContentTypes } = loadedContentTypes ?? await getContentTypes(client, args)

    // Start process
    process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Generating GraphQL fragments for ${contentTypes.map(x => x.key).join(', ')}\n`))
    const typeFolders = createdTypeFolders ?? createTypeFolders(contentTypes, basePath, debug)
    const updatedTypes = contentTypes.map(contentType => {
      const typePath = getTypeFolder(typeFolders, contentType.key)
      return createGraphQueries(contentType, typePath, basePath, force, debug, allContentTypes, client.runtimeCmsVersion == OptiCmsVersion.CMS12)
    }).filter(x => x).flat()

    // Report outcome
    if (updatedTypes.length > 0)
      process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Created/updated GraphQL fragments for ${updatedTypes.join(', ')}\n`))
    else
      process.stdout.write(chalk.yellowBright(`${figures.arrowRight} No GraphQL fragments created/updated\n`))
    if (!opts) process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n")

    generatedProps = []
  }
}

export default NextJsQueriesCommand

export function createGraphQueries(contentType: IntegrationApi.ContentType, typePath: string, basePath: string, force: boolean, debug: boolean, contentTypes: IntegrationApi.ContentType[], forCms12: boolean = false): Array<string> | undefined {
  const returnValue: Array<string> = []
  const baseQueryFile = path.join(typePath, `${contentType.key}.query.graphql`)
  if (fs.existsSync(baseQueryFile)) {
    if (force) {
      if (debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Overwriting ${contentType.displayName} (${contentType.key}) base fragment\n`))
    } else {
      if (debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${contentType.displayName} (${contentType.key}) base fragment - file already exists\n`))
      return undefined
    }
  } else if (debug) {
    process.stdout.write(chalk.gray(`${figures.arrowRight} Creating ${contentType.displayName} (${contentType.key}) base fragment\n`))
  }

  const { fragment, propertyTypes } = createInitialQuery(contentType, false, undefined, forCms12)
  fs.writeFileSync(baseQueryFile, fragment)
  returnValue.push(contentType.key)

  let dependencies = Array.isArray(propertyTypes) ? [...propertyTypes] : []
  while (Array.isArray(dependencies) && dependencies.length > 0) {
    let newDependencies: [string, boolean][] = []
    dependencies.forEach(dep => {
      const propContentType = contentTypes.filter(x => x.key == dep[0])[0]
      if (!propContentType) {
        console.warn(`🟠 The content type ${dep[0]} has been referenced, but is not found in the Optimizely CMS instance`)
        return
      }
      const fullTypeName = forCms12 ? contentType.key + propContentType.key : propContentType.key
      const propertyFragmentFile = path.join(basePath, propContentType.baseType, propContentType.key, `${fullTypeName}.property.graphql`)
      const propertyFragmentDir = path.dirname(propertyFragmentFile)

      if (!fs.existsSync(propertyFragmentDir))
        fs.mkdirSync(propertyFragmentDir, { recursive: true });

      if (!fs.existsSync(propertyFragmentFile) || force) {
        if (debug)
          process.stdout.write(chalk.gray(`${figures.arrowRight} Writing ${propContentType.displayName} (${propContentType.key}) property fragment\n`))
        const propContentTypeInfo = createInitialFragment(propContentType, true, contentType, forCms12)
        fs.writeFileSync(propertyFragmentFile, propContentTypeInfo.fragment)
        returnValue.push(propContentType.key)
        if (Array.isArray(propContentTypeInfo.propertyTypes))
          newDependencies.push(...propContentTypeInfo.propertyTypes)
      }
    })
    dependencies = newDependencies
  }
  return returnValue.length > 0 ? returnValue : undefined
}

function createInitialQuery(contentType: IntegrationApi.ContentType, forProperty: boolean = false, forBaseType?: IntegrationApi.ContentType, forCms12: boolean = false): { fragment: string, propertyTypes: ([string, boolean][] | null) } {
  const { fragmentFields, propertyTypes } = renderProperties(contentType, forCms12);
  const fragmentTarget = forProperty ? (forCms12 ? (forBaseType?.key ?? '') + contentType.key : contentType.key + 'Property') : contentType.key
  const tpl = `query get${fragmentTarget}Data($key: String!, $locale: [Locales], $version: String, $changeset: String, $variation: String) {
  data: ${fragmentTarget} (
    where: {
      _metadata: {
        version: { eq: $version }
        changeset: { eq: $changeset }
        variation: { eq: $variation }
      }
    }
    locale: $locale
    ids: [$key]
  ) {
    item {
      _metadata {
      	key
    	}
      ${fragmentFields.join("\n      ")}
    }
  }
}`
  return {
    fragment: tpl,
    propertyTypes: propertyTypes.length == 0 ? null : propertyTypes
  }
}