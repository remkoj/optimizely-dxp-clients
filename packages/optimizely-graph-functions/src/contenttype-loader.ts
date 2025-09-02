import { type Types } from '@graphql-codegen/plugin-helpers'
import { parse } from 'graphql'
import * as OptiCMS from './cms'
import type { IntegrationApi } from '@remkoj/optimizely-cms-api'
import { lcFirst, trimStart, ucFirst } from './tools'

type LoaderConfig = {
  pluginContext?: {
    [key: string]: any;
  }
}

type LoaderFunction = (documentUri: string, config: LoaderConfig) => Promise<Types.DocumentFile | undefined | void>

export const ContentTypePath = 'opti-cms:/contenttypes'

function isNonEmptyString<S extends string>(toTest: S | null | undefined | object | number | boolean): toTest is S {
  return typeof toTest === 'string' && toTest.length > 0
}

const ContentTypeLoader: LoaderFunction = async (documentUri, config) => {
  const url = new URL(documentUri)
  if (url.protocol !== "opti-cms:")
    return undefined;
  const [loaderType, baseType, contentTypeKey, ...targets] = url.pathname.split('/').filter(isNonEmptyString);
  if (loaderType !== 'contenttypes')
    return undefined;

  const contentType = await OptiCMS.getContentType(contentTypeKey)
  if (!contentType)
    return undefined

  const isForProperty = baseType.endsWith('.property')
  const rawSDL = isForProperty ? buildFragment(contentType, "PropertyData", "_", true) : buildFragment(contentType, "Data", "_")

  //console.log("Generated", contentTypeKey, isForProperty ? "Property" : "Item", rawSDL)

  return rawSDL ? {
    document: parse(rawSDL),
    location: documentUri,
    hash: documentUri,
    rawSDL
  } : undefined
}

/**
 * Get the Graph Type for the Content Type
 * @param contentType 
 * @returns 
 */
export function getGraphType(contentType: IntegrationApi.ContentType): string {
  return contentType.key ? contentType.key : "_IContent"
}

export function extractBaseType(contentType: IntegrationApi.ContentType, fallback: string = 'cms'): string {
  return (contentType.baseType ?? fallback).replace(/^_+/, '')
}

export function getContentTypeTargets(contentType: IntegrationApi.ContentType): string[] {
  if (!contentType.key || contentType.key.startsWith('graph:'))
    return [];

  const injections: string[] = [];
  const baseType = extractBaseType(contentType)
  switch (baseType) {
    case 'section':
      injections.push('SectionData')
      break;
    case 'page':
    case 'experience':
      injections.push('PageData')
      break;
    case 'media':
    case 'video':
    case 'image':
      injections.push('MediaData')
      break;
    case 'component': {
      const usage = contentType.compositionBehaviors ?? []
      const source = contentType.source

      if (!(source === '_server' && usage.length === 1 && usage[0] === 'formsElementEnabled'))
        injections.push('ComponentData')

      if (usage.includes('elementEnabled')) injections.push('ElementData')
      if (usage.includes('sectionEnabled')) injections.push('SectionData')
      if (usage.includes('formsElementEnabled')) injections.push('FormElementData')

      break;
    }
    default:
      injections.push('BlockData')
      break;
  }

  return injections
}

export function buildGetQuery(contentType: IntegrationApi.ContentType) {
  // Prepare
  if (!contentType.key || contentType.source === 'graph')
    return ''
  const graphType = getGraphType(contentType)

  // Render properties
  const properties: (string | null)[] = [];
  for (const propName of Object.getOwnPropertyNames(contentType.properties ?? {}))
    properties.push(buildProperty(propName, (contentType.properties || {})[propName]));

  // Inject base type based defaults
  if (contentType.baseType === "_experience")
    properties.push("...ExperienceData")

  //Render query
  const query = `query get${ucFirst(graphType)}Data($contentId: String!, $locale: [Locales], $changeset: String, $variation: String, $version: String) {
  ${graphType}(
    ids: [$contentId]
    locale: $locale
    variation: { include: SOME, value: [$variation], includeOriginal: true }
    where: { 
      _metadata: { 
        changeset: { eq: $changeset },
        variation: { eq: $variation },
        version: { eq: $version }
      } 
    }
  ) {
    item {
      _metadata {
        key
        displayName
        locale
        changeset
        variation
        version
      }
      ${properties}
    }
  }
}`
  return query
}

export function buildFragment(contentType: IntegrationApi.ContentType, fragmentPostfix: string = "Data", fragmentPrefix: string = "", forProperty: boolean = false) {
  if (!contentType.key || contentType.source === 'graph')
    return ''
  const fragmentName = fragmentPrefix + contentType.key + fragmentPostfix
  const graphType = forProperty ? getGraphType(contentType) + "Property" : getGraphType(contentType)

  // Inject all properties
  const properties: (string | null)[] = [];
  for (const propName of Object.getOwnPropertyNames(contentType.properties ?? {}))
    properties.push(buildProperty(propName, (contentType.properties || {})[propName]));

  // Inject base type based defaults
  if (contentType.baseType === "_experience")
    properties.push("...ExperienceData")

  // Ensure that there's at least one property
  if (properties.length === 0)
    properties.unshift("__typename")

  // Construct fragment rawSDL
  return `fragment ${fragmentName} on ${graphType} {
  ${properties.filter(x => x).join("\n  ")}
}`
}

export function buildProperty(propertyName: string, propertyConfig?: IntegrationApi.ContentTypeProperty): string | null {
  const propertyItemConfig = propertyConfig?.type === 'array' ? propertyConfig?.items ?? propertyConfig : propertyConfig
  const propertyType = propertyItemConfig?.type ?? 'n/a'
  switch (propertyType) {
    case 'url':
      return propertyName + " { type base default }"
    case 'content': {
      const pick: string[] = (propertyItemConfig?.allowedTypes ?? []).filter(x => !x.startsWith('_'))
      return propertyName + ` { 
    ...BlockData
    ...ComponentData
  }`
    }
    case 'richText':
      return propertyName + " { json html }"
    case 'component': {
      const dataType = propertyItemConfig?.contentType
      if (!dataType)
        return null // Skip this property if the contentType isn't set
      return propertyName + ` {  ...${dataType}PropertyData }`
    }
    case 'link':
      return propertyName + ` {
    title
    text
    target
    url {
      type
      base
      default
    }
  }`;
    case 'contentReference': {
      const pick: string[] = (propertyItemConfig?.allowedTypes ?? []).filter(x => !x.startsWith('_'))
      const hide: string[] = (propertyItemConfig?.restrictedTypes ?? []).filter(x => !x.startsWith('_'))
      const pickAll = pick.length == 0 || (pick.length == 1 && pick.at(0) === '*')
      if (hide.length > 0)
        console.log("Negative filtering isn't reflected in the Graph Queries")
      //const fragments = pick.map(x => "..." + x + "Data")
      /*
    item {
      ...IContentData${pickAll ? '\n    ...BlockData' : '\n    ' + fragments.join('\n    ')}
    }*/
      return propertyName + ` {
    key
    url {
      type
      base
      default
    }
  }`
    }
    default:
      return propertyName
  }
}

export default ContentTypeLoader