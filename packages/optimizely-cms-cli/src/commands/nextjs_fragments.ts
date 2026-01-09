import { IntegrationApi } from '@remkoj/optimizely-cms-api'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'

import { parseArgs } from '../tools/parseArgs.js'
import { createCmsClient } from '../tools/cmsClient.js'
import { getContentTypes, type GetContentTypesResult } from '../tools/contentTypes.js'
import { type NextJsModule, builder, createTypeFolders, getContentTypePaths, getTypeFolder, type TypeFolderList } from './_nextjs_base.js'
import GraphQLGen from "@remkoj/optimizely-graph-functions/contenttype-loader"

export const NextJsFragmentsCommand: NextJsModule<{ loadedContentTypes: GetContentTypesResult, createdTypeFolders: TypeFolderList }> = {
  command: "nextjs:fragments",
  describe: "Create the GrapQL Fragments for a Next.JS / Optimizely Graph structure",
  builder,
  handler: async (args, opts) => {

    // Prepare
    const { loadedContentTypes, createdTypeFolders } = opts || {}
    const { components: basePath, _config: { debug }, force, path: appPath } = parseArgs(args)
    const client = createCmsClient(args)

    // Get content types
    const { contentTypes, all: allContentTypes } = loadedContentTypes ?? await getContentTypes(client, args)

    // Start process
    process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Generating GraphQL fragments\n`))
    const typeFolders = createdTypeFolders ?? createTypeFolders(contentTypes, basePath, debug)
    const tracker = new GraphQLGen.PropertyCollisionTracker(appPath);
    const dependencies: string[] = []
    const updatedTypes = contentTypes.map(contentType => {
      const { written, propertyTypes } = createComponentFragments(contentType, getTypeFolder(typeFolders, contentType.key), force, debug, tracker)
      dependencies.push(...propertyTypes)
      return written ? contentType.key : undefined
    }).filter(x => x)

    // Report outcome
    if (updatedTypes.length > 0)
      process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Created/updated GraphQL fragments for ${updatedTypes.join(', ')}\n`))
    else
      process.stdout.write(chalk.yellowBright(`${figures.arrowRight} No GraphQL fragments created/updated\n`))


    // Start property generation process
    process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Generating GraphQL property fragments\n`))
    const generatedProps: string[] = createPropertyFragments(dependencies, allContentTypes, (contentType) => {
      if (!contentType.key) return undefined
      let tf = getTypeFolder(typeFolders, contentType.key)
      if (!tf) {
        tf = getContentTypePaths(contentType, basePath, true, debug)
        typeFolders.push(tf)
      }
      return tf
    }, force, debug, tracker)

    // Report outcome
    if (generatedProps.length > 0)
      process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Created/updated GraphQL property fragments for ${generatedProps.join(', ')}\n`))
    else
      process.stdout.write(chalk.yellowBright(`${figures.arrowRight} No GraphQL property fragments created/updated\n`))

    if (!opts) process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n")
  }
}

export function createComponentFragments(
  contentType: IntegrationApi.ContentType,
  typePath: TypeFolderList[number],
  force: boolean,
  debug: boolean,
  propertyTracker: Map<string,string> = new Map<string,string>()
): {
  written: boolean
  propertyTypes: string[]
} {
  const baseQueryFile = typePath.fragmentFile

  let writeFragment: boolean = true;
  if (fs.existsSync(baseQueryFile)) {
    if (force) {
      if (debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Overwriting ${contentType.displayName} (${contentType.key}) base fragment\n`))
    } else {
      if (debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${contentType.displayName} (${contentType.key}) base fragment - file already exists\n`))
      writeFragment = false
    }
  } else if (debug) {
    process.stdout.write(chalk.gray(`${figures.arrowRight} Creating ${contentType.displayName} (${contentType.key}) base fragment\n`))
  }

  let written: boolean = false
  if (writeFragment) {
    const fragment = GraphQLGen.buildFragment(contentType, undefined, false, propertyTracker)
    fs.writeFileSync(baseQueryFile, fragment)
    written = true
  }
  return { written, propertyTypes: GraphQLGen.getReferencedPropertyComponents(contentType) }
}

export function createPropertyFragments(
  propertyTypesList: string[],
  allContentTypes: IntegrationApi.ContentType[],
  selectTypeFolder: (ctKey: IntegrationApi.ContentType) => TypeFolderList[number] | undefined,
  force: boolean = false,
  debug: boolean = false,
  propertyTracker: Map<string,string> = new Map<string,string>()
) {
  const returnValue: string[] = []
  for (const propertyContentTypeKey of propertyTypesList.filter((v, i, a) => a.indexOf(v, i + 1) <= i)) {
    // Load the ContentType definition
    const contentType = allContentTypes.filter(x => x.key == propertyContentTypeKey).at(0)
    if (!contentType) {
      console.warn(`🟠 The content type ${propertyContentTypeKey} has been referenced, but is not found in the Optimizely CMS instance`)
      continue
    }

    // Load the paths for this ContentType
    const depFolder = selectTypeFolder(contentType)
    if (!depFolder) {
      console.warn(`🟠 The content type ${propertyContentTypeKey} cannot be stored in the project`)
      continue
    }

    const propertyFragmentFile = depFolder.propertyFragmentFile
    let mustWrite: boolean = true
    if (fs.existsSync(propertyFragmentFile)) {
      if (force) {
        if (debug)
          process.stdout.write(chalk.gray(`${figures.arrowRight} Overwriting ${contentType.displayName} (${contentType.key}) property fragment\n`))
      } else {
        if (debug)
          process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${contentType.displayName} (${contentType.key}) property fragment - file already exists\n`))
        mustWrite = false
      }
    } else if (debug) {
      process.stdout.write(chalk.gray(`${figures.arrowRight} Creating ${contentType.displayName} (${contentType.key}) property fragment\n`))
    }
    if (mustWrite) {
      const fragment = GraphQLGen.buildFragment(contentType, undefined, true, propertyTracker)
      fs.writeFileSync(propertyFragmentFile, fragment)
      returnValue.push(contentType.key)
    }

    // Recurse down for properties that we're not yet rendering
    const referencedPropertyTypes = GraphQLGen.getReferencedPropertyComponents(contentType).filter(x => !propertyTypesList.includes(x))
    if (referencedPropertyTypes.length > 0) {
      if (debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Component property ${propertyContentTypeKey} uses components a property, recursing down\n`))
      const additionalProperties = createPropertyFragments(referencedPropertyTypes, allContentTypes, selectTypeFolder, force, debug, propertyTracker)
      returnValue.push(...additionalProperties)
    }
  }
  return returnValue
}

export default NextJsFragmentsCommand
