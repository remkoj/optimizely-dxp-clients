import { IntegrationApi, OptiCmsVersion } from '@remkoj/optimizely-cms-api'
import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'

import { parseArgs } from '../tools/parseArgs.js'
import { createCmsClient } from '../tools/cmsClient.js'
import { getContentTypes, type GetContentTypesResult } from '../tools/contentTypes.js'
import { type NextJsModule, builder, createTypeFolders, getTypeFolder, getGeneratedProps, writeGeneratedProps, type TypeFolderList, type GeneratedPropsArray } from './_nextjs_base.js'

export const NextJsFragmentsCommand: NextJsModule<{ loadedContentTypes: GetContentTypesResult, createdTypeFolders: TypeFolderList }> = {
  command: "nextjs:fragments",
  describe: "Create the GrapQL Fragments for a Next.JS / Optimizely Graph structure",
  builder,
  handler: async (args, opts) => {
    // Prepare
    const { loadedContentTypes, createdTypeFolders } = opts || {}
    const { components: basePath, _config: { debug }, force, path: appPath } = parseArgs(args)
    const client = createCmsClient(args)

    // Get locked property names
    const generatedProps = getGeneratedProps(appPath);

    // Get content types
    const { contentTypes, all: allContentTypes } = loadedContentTypes ?? await getContentTypes(client, args)

    // Start process
    process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Generating GraphQL fragments for ${contentTypes.map(x => x.key).join(', ')}\n`))
    const typeFolders = createdTypeFolders ?? createTypeFolders(contentTypes, basePath, debug)
    const updatedTypes = contentTypes.map(contentType => {
      const typePath = getTypeFolder(typeFolders, contentType.key)
      return createGraphFragments(contentType, typePath, basePath, force, debug, allContentTypes, generatedProps, client.runtimeCmsVersion == OptiCmsVersion.CMS12)
    }).filter(x => x).flat()

    // Report outcome
    if (updatedTypes.length > 0)
      process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Created/updated GraphQL fragments for ${updatedTypes.join(', ')}\n`))
    else
      process.stdout.write(chalk.yellowBright(`${figures.arrowRight} No GraphQL fragments created/updated\n`))
    
    // Write updated lock
    writeGeneratedProps(appPath, generatedProps);

    if (!opts) process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n")
  }
}

export function createGraphFragments(contentType: IntegrationApi.ContentType, typePath: string, basePath: string, force: boolean, debug: boolean, contentTypes: IntegrationApi.ContentType[], generatedProps: GeneratedPropsArray = [], forCms12: boolean = false): Array<string> | undefined {
  const returnValue: Array<string> = []
  const baseType = contentType.baseType ?? 'default'
  const baseQueryFile = path.join(typePath, `${contentType.key.split(':').pop()}.${baseType}.graphql`)
  //console.log('Mapping', contentType.key, baseQueryFile);
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

  const { fragment, propertyTypes } = createInitialFragment(contentType, false, undefined, generatedProps, forCms12)
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
      const propertyFragmentFile = path.join(basePath, propContentType.baseType, propContentType.key.split(':').pop(), `${fullTypeName.split(':').pop()}.property.graphql`)
      const propertyFragmentDir = path.dirname(propertyFragmentFile)

      if (!fs.existsSync(propertyFragmentDir))
        fs.mkdirSync(propertyFragmentDir, { recursive: true });

      if (!fs.existsSync(propertyFragmentFile) || force) {
        if (debug)
          process.stdout.write(chalk.gray(`${figures.arrowRight} Writing ${propContentType.displayName} (${propContentType.key}) property fragment\n`))
        const propContentTypeInfo = createInitialFragment(propContentType, true, contentType, generatedProps, forCms12)
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

export function createInitialFragment(contentType: IntegrationApi.ContentType, forProperty: boolean = false, forBaseType?: IntegrationApi.ContentType, generatedProps: GeneratedPropsArray = [], forCms12: boolean = false): { fragment: string, propertyTypes: ([string, boolean][] | null) } {
  const { fragmentFields, propertyTypes } = renderProperties(contentType, generatedProps, forCms12);
  const contentTypeKey = contentType.key.split(':').pop();
  const fragmentTarget = forProperty ? (forCms12 ? (forBaseType?.key ?? '') + contentTypeKey : contentTypeKey + 'Property') : contentTypeKey

  const tpl = `fragment ${fragmentTarget}Data on ${fragmentTarget} {
  ${fragmentFields.join("\n  ")}
}`
  return {
    fragment: tpl,
    propertyTypes: propertyTypes.length == 0 ? null : propertyTypes
  }
}

export function renderProperties(contentType: IntegrationApi.ContentType, generatedProps: GeneratedPropsArray = [], forCms12: boolean = false) {
  const propertyTypes: [string, boolean][] = []
  const fragmentFields: string[] = []
  const typeProps = contentType.properties ?? {}
  Object.getOwnPropertyNames(typeProps).forEach(propKey => {
    // Exclude system properties, which are not present in Optimizely Graph
    if (['experience', 'section'].includes(contentType.baseType) && ['AdditionalData', 'UnstructuredData', 'Layout'].includes(propKey))
      return

    // Exclude CMS 12 System Properties
    if (forCms12 && ['Categories'].includes(propKey))
      return

    const propType = (typeProps[propKey] as IntegrationApi.ContentTypeProperty).type
    const propDataType = getPropDataType(typeProps[propKey] as IntegrationApi.ContentTypeProperty)
    const isConflict = generatedProps.some(x => x.propName == propKey && x.propType != propDataType)
    const propName = isConflict ? `${contentType.key}${propKey}: ${propKey}` : propKey

    // Write the property
    switch (propType) {
      case IntegrationApi.PropertyDataType.ARRAY:
        {
          const typeData = typeProps[propKey] as IntegrationApi.ListProperty
          switch (typeData.items.type) {
            case IntegrationApi.PropertyDataType.INTEGER:
              if (typeData.format == 'categorization') {
                //fragmentFields.push(`${propName} { Id, Name, Description }`)
                console.warn(chalk.redBright(`❗ Property ${ propName } is a 'categorization', this is not supported. If you need to use this property, add it manually into the generated files`));
              } else
                fragmentFields.push(propName)
              break
            case IntegrationApi.PropertyDataType.STRING:
              fragmentFields.push(propName)
              break;
            case IntegrationApi.PropertyDataType.CONTENT:
              if (contentType.baseType == 'page' || (contentType.baseType as string) == 'experience')
                fragmentFields.push(`${propName} { ...${forCms12 ? 'PageIContentListItem' : 'BlockData'} }`)
              else
                fragmentFields.push(`${propName} { ...IContentListItem }`)
              break;
            case IntegrationApi.PropertyDataType.COMPONENT:
              const componentType = (typeData.items as IntegrationApi.ComponentListItem).contentType.split(':').pop()
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
            case IntegrationApi.PropertyDataType.CONTENT_REFERENCE:
              fragmentFields.push(`${propName} { ...ReferenceData }`)
              break;
            default:
              fragmentFields.push(`${propName} { __typename }`)
              break;
          }
          break;
        }
      case IntegrationApi.PropertyDataType.STRING: {
        const propDetails = typeProps[propKey] as IntegrationApi.StringProperty
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
      case IntegrationApi.PropertyDataType.URL:
        fragmentFields.push(forCms12 ? propName : `${propName} { ...LinkData }`)
        break;
      case IntegrationApi.PropertyDataType.CONTENT_REFERENCE:
        fragmentFields.push(`${propName} { ...ReferenceData }`)
        break;
      case IntegrationApi.PropertyDataType.COMPONENT: {
        const componentType = (typeProps[propKey] as IntegrationApi.ComponentProperty).contentType.split(':').pop()
        if (componentType == "link") {
          fragmentFields.push(`${propName} { ...LinkItemData }`)
        } else {
          const componentFragmentName = forCms12 ? contentType.key + componentType : componentType + 'Property'
          fragmentFields.push(`${propName} { ...${componentFragmentName}Data }`)
          propertyTypes.push([componentType, true])
        }
        break;
      }
      case IntegrationApi.PropertyDataType.BINARY:
        fragmentFields.push(propName)
        break;
      case IntegrationApi.PropertyDataType.CONTENT:
        fragmentFields.push(`${propName} { ...${forCms12 ? 'PageIContentListItem' : 'BlockData'} }`)
        break;
      default:
        fragmentFields.push(propName)
        break;
    }

    if (propName === propKey && !generatedProps.some(x => x.propName === propKey))
      generatedProps.push({
        propType: propDataType,
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

  return { fragmentFields, propertyTypes }
}

function ucFirst(value: string | null | undefined) {
  if (typeof (value) != 'string' || value.length == 0)
    return value
  return value.substring(0, 1).toUpperCase() + value.substring(1)
}

export default NextJsFragmentsCommand

function getPropDataType(baseInfo: IntegrationApi.ContentTypeProperty)
{
  const baseType = baseInfo.type;
  if (!baseType)
    throw new Error("Invalid property type definition");
  const propInfo: { type: IntegrationApi.PropertyDataType, format?: string } = baseInfo.type === "array" ? (baseInfo as IntegrationApi.ListProperty).items : baseInfo
  switch (propInfo.type) {
    case "string":
      return propInfo.format === 'html' ? 'richtext' : propInfo.type;
    default:
      return propInfo.type;
  }
}
