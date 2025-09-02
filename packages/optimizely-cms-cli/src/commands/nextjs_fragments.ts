import { IntegrationApi, OptiCmsVersion } from '@remkoj/optimizely-cms-api'
import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'

import { parseArgs } from '../tools/parseArgs.js'
import { createCmsClient } from '../tools/cmsClient.js'
import { getContentTypes, getContentTypePaths, type GetContentTypesResult } from '../tools/contentTypes.js'
import { type NextJsModule, builder, createTypeFolders, getTypeFolder, type TypeFolderList } from './_nextjs_base.js'


/**
 * Keep track of all generated properties
 */
let generatedProps: Array<{ propType: string, propName: string }> = []

export const NextJsQueriesCommand: NextJsModule<{ loadedContentTypes: GetContentTypesResult, createdTypeFolders: TypeFolderList }> = {
  command: "nextjs:fragments",
  describe: "Create the GrapQL Fragments for a Next.JS / Optimizely Graph structure",
  builder,
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
      return createGraphFragments(contentType, typeFolders, basePath, force, debug, allContentTypes, false)
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

function createGraphFragments(contentType: IntegrationApi.ContentType, typeFolders: TypeFolderList, basePath: string, force: boolean, debug: boolean, contentTypes: IntegrationApi.ContentType[], forCms12: boolean = false): Array<string> | undefined {
  const returnValue: Array<string> = []
  const typePath = getTypeFolder(typeFolders, contentType.key)
  const baseQueryFile = typePath.fragmentFile
  const { fragment, propertyTypes } = createInitialFragment(contentType, false, undefined, forCms12)

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

  if (writeFragment) {
    fs.writeFileSync(baseQueryFile, fragment)
    returnValue.push(contentType.key)
  }

  let dependencies = Array.isArray(propertyTypes) ? [...propertyTypes] : []
  while (Array.isArray(dependencies) && dependencies.length > 0) {
    let newDependencies: [string, boolean][] = []
    dependencies.forEach(dep => {
      const propContentType = contentTypes.filter(x => x.key == dep[0])[0]
      if (!propContentType) {
        console.warn(`🟠 The content type ${dep[0]} has been referenced, but is not found in the Optimizely CMS instance`)
        return
      }
      const depFolder = getTypeFolder(typeFolders, propContentType.key) ?? getTypeFolder(createTypeFolders([propContentType], basePath), propContentType.key)
      if (!propContentType) {
        console.warn(`🟠 The content type ${dep[0]} cannot be stored in the project`)
        return
      }
      const propertyFragmentFile = depFolder.propertyFragmentFile
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

function createInitialFragment(contentType: IntegrationApi.ContentType, forProperty: boolean = false, forBaseType?: IntegrationApi.ContentType, forCms12: boolean = false): { fragment: string, propertyTypes: ([string, boolean][] | null) } {
  const propertyTypes: [string, boolean][] = []
  const fragmentFields: string[] = []
  const typeProps = contentType.properties ?? {}
  Object.getOwnPropertyNames(typeProps).forEach(propKey => {
    // Exclude system properties, which are not present in Optimizely Graph
    if (['_experience', '_section'].includes(contentType.baseType) && ['AdditionalData', 'UnstructuredData', 'Layout'].includes(propKey))
      return

    // Exclude CMS 12 System Properties
    if (forCms12 && ['Categories'].includes(propKey))
      return

    const propType = (typeProps[propKey] as IntegrationApi.ContentTypeProperty).type
    const isConflict = generatedProps.some(x => x.propName == propKey && x.propType != propType)
    const propName = isConflict ? `${contentType.key}${propKey}: ${propKey}` : propKey

    // Write the property
    switch (propType) {
      case 'array':
        {
          const typeData = typeProps[propKey] as { items: IntegrationApi.ArrayItem & { contentType: string }, format: string | null }
          switch (typeData.items.type) {
            case 'integer':
              if (typeData.format == 'categorization')
                fragmentFields.push(`${propName} { Id, Name, Description }`)
              else
                fragmentFields.push(propName)
              break
            case 'string':
              fragmentFields.push(propName)
              break;
            case 'content':
              if (contentType.baseType == 'page' || (contentType.baseType as string) == 'experience')
                fragmentFields.push(`${propName} { ...${forCms12 ? 'PageIContentListItem' : 'BlockData'} }`)
              else
                fragmentFields.push(`${propName} { ...IContentListItem }`)
              break;
            case 'component':
              const componentType = typeData.items.contentType
              switch (componentType) {
                case 'link':
                  fragmentFields.push(`${propName} { ...LinkItemData }`)
                  break;
                default:
                  {
                    const componentFragmentName = forCms12 ? contentType.key + componentType : componentType + 'Property'
                    fragmentFields.push(`${propName} { ...${componentFragmentName}Data }`)
                    propertyTypes.push([componentType, true])
                    break;
                  }
              }
              break;
            case 'contentReference':
              fragmentFields.push(`${propName} { ...ReferenceData }`)
              break;
            default:
              fragmentFields.push(`${propName} { __typename }`)
              break;
          }
          break;
        }
      case 'string': {
        const propDetails = typeProps[propKey] as { format: string | null }
        switch (propDetails.format ?? "") {
          case 'html':
            fragmentFields.push(forCms12 ? `${propName} { Structure, Html }` : `${propName} { json, html }`)
            break
          case 'shortString':
          case 'selectOne':
          case '':
            fragmentFields.push(propName)
            break
          default:
            if (!isConflict)
              console.warn(chalk.redBright(`❗ Unsupported string format "${propDetails.format}" for ${contentType.key}.${propKey}; add it manually to the fragment if you need to access this field`))
            break
        }
        break;
      }
      case 'url':
        fragmentFields.push(forCms12 ? propName : `${propName} { ...LinkData }`)
        break;
      case 'contentReference':
        fragmentFields.push(`${propName} { ...ReferenceData }`)
        break;
      case 'component': {
        const componentType = (typeProps[propKey] as { contentType: string }).contentType
        if (forCms12 && componentType == "link") {
          fragmentFields.push(`${propName} { ...LinkItemData }`)
        } else {
          const componentFragmentName = forCms12 ? contentType.key + componentType : componentType + 'Property'
          fragmentFields.push(`${propName} { ...${componentFragmentName}Data }`)
          propertyTypes.push([componentType, true])
        }
        break;
      }
      case 'binary':
        fragmentFields.push(`${propName} { ...BinaryData }`)
        break;
      default:
        fragmentFields.push(propName)
        break;
    }

    generatedProps.push({
      propType: (typeProps[propKey] as IntegrationApi.ContentTypeProperty).type,
      propName: propKey
    })
  })

  if ((contentType.baseType as string) == "experience")
    fragmentFields.push('...ExperienceData')

  if (fragmentFields.length == 0) {
    if (forCms12)
      fragmentFields.push('empty: _metadata: ContentLink { key: GuidValue }')
    else
      fragmentFields.push('empty: _metadata { key }')
  }

  const fragmentTarget = forProperty ? (forCms12 ? (forBaseType?.key ?? '') + contentType.key : contentType.key + 'Property') : contentType.key
  const tpl = `fragment ${fragmentTarget}Data on ${fragmentTarget} {
  ${fragmentFields.join("\n  ")}
}`
  return {
    fragment: tpl,
    propertyTypes: propertyTypes.length == 0 ? null : propertyTypes
  }
}

function ucFirst(value: string | null | undefined) {
  if (typeof (value) != 'string' || value.length == 0)
    return value
  return value.substring(0, 1).toUpperCase() + value.substring(1)
}

export default NextJsQueriesCommand
