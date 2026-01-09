import { IntegrationApi } from '@remkoj/optimizely-cms-api'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'

import { parseArgs } from '../tools/parseArgs.js'
import { createCmsClient } from '../tools/cmsClient.js'
import { getContentTypes, contentTypesBuilder, ContentTypesArgsDefaults, type GetContentTypesResult } from '../tools/contentTypes.js'
import { type NextJsModule, createTypeFolders, getTypeFolder, type TypeFolderList, getContentTypePaths } from './_nextjs_base.js'
import { createPropertyFragments } from './nextjs_fragments.js'
import GraphQLGen from "@remkoj/optimizely-graph-functions/contenttype-loader"

export const NextJsQueriesCommand: NextJsModule<{ loadedContentTypes: GetContentTypesResult, createdTypeFolders: TypeFolderList }> = {
  command: "nextjs:queries",
  describe: "Create the GrapQL Queries to use two queries to load content",
  builder: yargs => {
    const updatedArgs = contentTypesBuilder(yargs, { ...ContentTypesArgsDefaults, baseTypes: ['page', 'experience'] })
    updatedArgs.option('force', { alias: 'f', description: "Overwrite existing files", boolean: true, type: 'boolean', demandOption: false, default: false })
    return updatedArgs
  },
  handler: async (args, opts) => {
    // Prepare
    const { loadedContentTypes, createdTypeFolders } = opts || {}
    const { components: basePath, _config: { debug }, force, path: appPath } = parseArgs(args)
    const client = createCmsClient(args)
    const { contentTypes, all: allContentTypes } = loadedContentTypes ?? await getContentTypes(client, args)
    const generatedProps = getGeneratedProps(appPath);

    // Start process
    process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Generating GraphQL queries\n`))
    const dependencies: string[] = []
    const typeFolders = createdTypeFolders ?? createTypeFolders(contentTypes, basePath, debug)
    const updatedTypes = contentTypes.map(contentType => {
      const typePath = getTypeFolder(typeFolders, contentType.key)
      const { written, propertyTypes } = createGraphQueries(contentType, typePath, force, debug)
      dependencies.push(...propertyTypes)
      return written ? contentType.key : undefined
    }).filter(x => x).flat()

    // Report outcome
    if (updatedTypes.length > 0)
      process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Created/updated GraphQL queries for ${updatedTypes.join(', ')}\n`))
    else
      process.stdout.write(chalk.yellowBright(`${figures.arrowRight} No GraphQL queries created/updated\n`))

    process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Generating GraphQL property fragments\n`))
    const generatedProps: string[] = createPropertyFragments(dependencies, allContentTypes, (contentType) => {
      if (!contentType.key) return undefined
      let tf = getTypeFolder(typeFolders, contentType.key)
      if (!tf) {
        tf = getContentTypePaths(contentType, basePath, true, debug)
        typeFolders.push(tf)
      }
      return tf
    }, force, debug)

    // Report outcome
    if (generatedProps.length > 0)
      process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Created/updated GraphQL property fragments for ${generatedProps.join(', ')}\n`))
    else
      process.stdout.write(chalk.yellowBright(`${figures.arrowRight} No GraphQL property fragments created/updated\n`))

    if (!opts) process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n")
  }
}

export default NextJsQueriesCommand

export function createGraphQueries(
  contentType: IntegrationApi.ContentType,
  typePath: TypeFolderList[number],
  force: boolean,
  debug: boolean,
): { written: boolean, propertyTypes: string[] } {
  const baseQueryFile = typePath.queryFile

  let mustWrite: boolean = true
  if (fs.existsSync(baseQueryFile)) {
    if (force) {
      if (debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Overwriting ${contentType.displayName} (${contentType.key}) base fragment\n`))
    } else {
      if (debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${contentType.displayName} (${contentType.key}) base fragment - file already exists\n`))
      mustWrite = false
    }
  } else if (debug) {
    process.stdout.write(chalk.gray(`${figures.arrowRight} Creating ${contentType.displayName} (${contentType.key}) base fragment\n`))
  }

  if (mustWrite) {
    const fragment = GraphQLGen.buildGetQuery(contentType, undefined, new Map())
    fs.writeFileSync(baseQueryFile, fragment)
  }

  return {
    written: mustWrite,
    propertyTypes: GraphQLGen.getReferencedPropertyComponents(contentType)
  }
}
