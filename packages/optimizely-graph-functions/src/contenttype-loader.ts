import { type Types } from '@graphql-codegen/plugin-helpers'
import { parse } from 'graphql'
import * as OptiCMS from './cms'
import type { IntegrationApi } from '@remkoj/optimizely-cms-api'
import { ucFirst, isNonEmptyString } from './tools'

export * as Tools from './tools'

type LoaderConfig = {
  pluginContext?: {
    [key: string]: any;
  }
}

type LoaderFunction = (documentUri: string, config: LoaderConfig) => Promise<Types.DocumentFile | undefined | void>

const ContentTypeLoader: LoaderFunction = async (documentUri, config) => {
  const parsedData = parseVirtualLocation(documentUri)
  if (!parsedData)
    return undefined

  const { type: loaderType, contentTypeBase: baseType, contentTypeKey, forProperty: isForProperty } = parsedData

  const contentType = await OptiCMS.getContentType(contentTypeKey)
  if (!contentType)
    throw new Error(`ContentType with key ${baseType} cannot be loaded`)

  if (contentType.baseType !== baseType)
    throw new Error(`ContentType base types don't match, expected ${baseType} but received ${contentType.baseType}`)

  const rawSDL = loaderType === 'fragment' ?
    buildFragment(contentType, (name) => '_' + name, isForProperty) :
    buildGetQuery(contentType)

  return rawSDL ? {
    document: parse(rawSDL),
    location: documentUri,
    hash: documentUri,
    rawSDL
  } : undefined
}

export type VirtualLocationOptions = { forProperty: boolean, type: 'fragment' | 'query' }
export type VirtualLocationData = { contentTypeBase: string, contentTypeKey: string, injectionTargets: Array<string> } & VirtualLocationOptions
const DefaultVirtualLocationOptions: VirtualLocationOptions = { forProperty: false, type: 'fragment' }

export function parseVirtualLocation(virtualPath: string): VirtualLocationData | undefined {
  if (!virtualPath.startsWith('opti-cms:/'))
    return undefined
  const virtualURL = new URL(virtualPath)
  const [basePath, baseType, ctKey, ...targets] = virtualURL.pathname.split('/').filter(isNonEmptyString);

  // Validate the basepath
  if (!['contenttypes', 'contentquery'].includes(basePath))
    return undefined

  const type = basePath == "contenttypes" ? 'fragment' : 'query';
  const forProperty = baseType.endsWith('.property')
  const contentTypeBase = parseBaseType(forProperty ? baseType.substring(0, baseType.length - 9) : baseType);
  const contentTypeKey = ctKey;
  const injectionTargets = targets
  return { type, contentTypeBase, contentTypeKey, injectionTargets, forProperty }
}

export function buildVirtualLocation(contentType: IntegrationApi.ContentType, options?: Partial<VirtualLocationOptions>) {
  const { forProperty, type } = { ...DefaultVirtualLocationOptions, ...options };
  const basePath = type == 'fragment' ? 'contenttypes' : 'contentquery'
  const ctKey = contentType.key
  if (!ctKey || contentType.source === 'graph' || contentType.source === '_system')
    return undefined
  const baseType = extractBaseType(contentType)
  return forProperty ?
    `opti-cms:/${basePath}/${baseType}.property/${ctKey}` :
    `opti-cms:/${basePath}/${baseType}/${ctKey}/${getContentTypeTargets(contentType).join('/')}`
}

/**
 * Get the Graph Type for the Content Type
 * @param contentType 
 * @returns 
 */
export function getGraphType(contentType: IntegrationApi.ContentType): string {
  return contentType.key ? contentType.key : "_IContent"
}
export function getGraphPropertyType(contentType: IntegrationApi.ContentType): string {
  return (contentType.key ? contentType.key : "_IContent") + "Property"
}

export function parseBaseType(storedBaseType: string) {
  switch (storedBaseType.toLowerCase()) {
    case 'section':
    case 'media':
    case 'component':
    case 'experience':
    case 'page':
      return '_' + storedBaseType;
    default:
      return storedBaseType;
  }
}

export function extractBaseType(contentType: IntegrationApi.ContentType, fallback: string = 'cms'): string {
  return (contentType.baseType ?? fallback).replace(/^_+/, '')
}

export enum ContentTypeTarget {
  'SectionData' = 'SectionData',
  'PageData' = 'PageData',
  'MediaData' = 'MediaData',
  'ComponentData' = 'ComponentData',
  'ElementData' = 'ElementData',
  'SectionElementData' = 'SectionElementData',
  'FormElementData' = 'FormElementData',
  'BlockData' = 'BlockData',
}

export function getContentTypeTargets(contentType: IntegrationApi.ContentType): ContentTypeTarget[] {
  if (!contentType.key || contentType.key.startsWith('graph:'))
    return [];

  const injections: ContentTypeTarget[] = [];
  const baseType = extractBaseType(contentType)
  switch (baseType) {
    case 'section':
      injections.push(ContentTypeTarget.SectionData)
      break;
    case 'page':
    case 'experience':
      injections.push(ContentTypeTarget.PageData)
      break;
    case 'media':
    case 'video':
    case 'image':
      injections.push(ContentTypeTarget.MediaData)
      break;
    case 'component': {
      const usage = contentType.compositionBehaviors ?? []
      const source = contentType.source

      if (!(source === '_server' && usage.length === 1 && usage[0] === 'formsElementEnabled'))
        injections.push(ContentTypeTarget.ComponentData)

      if (usage.includes('elementEnabled')) injections.push(ContentTypeTarget.ElementData)
      if (usage.includes('sectionEnabled')) injections.push(ContentTypeTarget.SectionElementData)
      if (usage.includes('formsElementEnabled')) injections.push(ContentTypeTarget.FormElementData)

      break;
    }
    default:
      injections.push(ContentTypeTarget.BlockData)
      break;
  }

  return injections
}

export function buildGetQuery(contentType: IntegrationApi.ContentType, queryName?: string | ((defaultName: string) => string), propertyTracker: PropertyCollisionTracker = new Map()) {
  // Prepare
  if (!contentType.key || contentType.source === 'graph')
    return ''
  const graphType = getGraphType(contentType)
  const renderedQueryName = isNonEmptyString(queryName) ? queryName :
    (typeof queryName === 'function' ? queryName(`get${ucFirst(graphType)}Data`) :
      `get${ucFirst(graphType)}Data`)

  // Render properties
  const properties: (string | null)[] = [];
  for (const propName of Object.getOwnPropertyNames(contentType.properties ?? {}))
    properties.push(buildProperty(propName, (contentType.properties || {})[propName], propertyTracker));

  // Inject base type based defaults
  if (contentType.baseType === "_experience")
    properties.unshift("...ExperienceData")

  //Render query
  const query = `query ${renderedQueryName}($key: [String!]!, $locale: [Locales], $changeset: String, $variation: VariationInput, $version: String) {
  data: ${graphType}(
    ids: $key
    locale: $locale
    variation: $variation
    where: { _metadata: { changeset: { eq: $changeset }, version: { eq: $version } } }
  ) {
    total
    item {
      _metadata {
        key
        version
        locale
        changeset
        variation
      }
      ${properties.filter(isNonEmptyString).join("\n      ")}
    }
  }
}`
  return query
}

/**
 * Retrieve a list of component keys that are referenced as property by this type
 * 
 * @param contentType 
 * @returns 
 */
export function getReferencedPropertyComponents(contentType: IntegrationApi.ContentType): string[] {
  const properties = contentType.properties
  if (!properties)
    return []

  return Object.getOwnPropertyNames(properties).reduce((referencedTypes, propertyKey) => {
    if (properties[propertyKey].type == "component" && properties[propertyKey].contentType) {
      referencedTypes.push(properties[propertyKey]?.contentType)
    }
    if (properties[propertyKey].type == "array" && properties[propertyKey].items?.type == "component" && properties[propertyKey].items?.contentType) {
      referencedTypes.push(properties[propertyKey]?.items?.contentType)
    }
    return referencedTypes
  }, [] as string[])
}

export function getSlugFromKey(key: string) {
  let newKey = key.startsWith('_') ? ucFirst(key.substring(1)) : key
  if (newKey.includes(":"))
    newKey = newKey.split(":").map(x => ucFirst(x)).join("")
  return newKey
}

/**
 * Tracker for all properties, indexed by property name, then type
 * for a list of all ContentTypes.
 */
export type PropertyCollisionTracker = Map<string, string>

export function buildFragment(contentType: IntegrationApi.ContentType, fragmentName?: string | ((defaultName: string) => string), forProperty: boolean = false, propertyTracker: PropertyCollisionTracker = new Map()) {
  if (!contentType.key)
    return ''
  const graphType = forProperty ? getGraphPropertyType(contentType) : getGraphType(contentType)
  const graphFragmentName = isNonEmptyString(fragmentName) ?
    fragmentName : (typeof fragmentName === 'function' ? fragmentName(ucFirst(graphType) + "Data") : ucFirst(graphType) + "Data")

  // Inject all properties
  const properties: (string | null)[] = [];
  for (const propName of Object.getOwnPropertyNames(contentType.properties ?? {}))
    properties.push(buildProperty(propName, (contentType.properties || {})[propName], propertyTracker));

  // Inject base type based defaults
  if (contentType.baseType === "_experience")
    properties.push("...ExperienceData")

  // Ensure that there's at least one property
  if (properties.length === 0)
    properties.unshift("__typename")

  // Construct fragment rawSDL
  return `fragment ${graphFragmentName} on ${graphType} {
  ${properties.filter(isNonEmptyString).join("\n  ")}
}`
}

export function buildProperty(propertyName: string, propertyConfig?: IntegrationApi.ContentTypeProperty, propertyTracker: PropertyCollisionTracker = new Map()): string | null {
  const propertyItemConfig = propertyConfig?.type === 'array' ? propertyConfig?.items ?? propertyConfig : propertyConfig
  const propertyType = propertyItemConfig?.type ?? 'any'

  // Ensure we don't have property naming collisions
  let outputPropertyName = propertyName
  if (propertyTracker.has(propertyName)) {
    if (propertyTracker.get(propertyName) != propertyType) {
      outputPropertyName = `${propertyName}${ucFirst(propertyType)}: ${propertyName}`
    }
  } else {
    propertyTracker.set(propertyName, propertyType)
  }

  switch (propertyType) {
    case 'url':
      return outputPropertyName + " { type base default }"
    case 'content': {
      const pick: string[] = (propertyItemConfig?.allowedTypes ?? [])
      if (pick.length == 0) {
        return outputPropertyName + ` { 
    ...IContentData
    ...BlockData
    ...ComponentData
  }`
      } else {
        return outputPropertyName + ` {
    ...IContentData
    ${pick.map(x => {
          return `...${getSlugFromKey(x)}Data`
        }).join("\n    ")}
  }`
      }
    }
    case 'richText':
      return outputPropertyName + " { json }"
    case 'component': {
      const dataType = propertyItemConfig?.contentType
      if (!dataType)
        return null // Skip this property if the contentType isn't set
      return outputPropertyName + ` {  ...${dataType}PropertyData }`
    }
    case 'link':
      return outputPropertyName + ` {
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
      return outputPropertyName + ` {
    key
    url {
      type
      base
      default
    }
    item @depend(on: "ContentReference.item") {
      __typename
      ...CmpImageAssetInfo
      ...CmpVideoAssetInfo
    }
  }`
    }
    default:
      return outputPropertyName
  }
}

export default ContentTypeLoader
