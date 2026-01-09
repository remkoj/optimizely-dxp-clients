import { type Types } from '@graphql-codegen/plugin-helpers'
import { parse } from 'graphql'
import * as OptiCMS from './cms'
import type { IntegrationApi } from '@remkoj/optimizely-cms-api'
import { ucFirst, isNonEmptyString } from './tools'
import { parseVirtualLocation } from './virtual-location'
import path from 'node:path'
import fs from 'node:fs'

/**
 * Export the virtual location builder and injection targets
 */
export { parseVirtualLocation, buildVirtualLocation, ContentTypeTarget as InjectionTargets, getInjectionTargets } from './virtual-location'

export * as Tools from './tools'

type LoaderConfig = {
  cwd: string,
  pluginContext?: {
    [key: string]: any;
  }
}

type LoaderFunction = (documentUri: string, config: LoaderConfig) => Promise<Types.DocumentFile | undefined | void>



/**
 * Tracker for all properties, indexed by property name, then type
 * for a list of all ContentTypes. This uses a lock file to remember
 * any collision resolutions done by the code generation.
 */
export class PropertyCollisionTracker extends Map<string,string> {
  private _cwd: string | undefined;
  private _ready: boolean = false;

  public set cwd(newValue: string | undefined)
  {
    if (newValue !== this._cwd) {
      this._cwd = newValue
      super.clear();
      if (newValue === undefined) {
        this._ready = false;
        return
      }
      
      this.readLock();
      this._ready = true;
    }
  }

  public get cwd(): string | undefined {
    return this._cwd
  }

  public constructor(cwd?: string)
  {
    super()
    this.cwd = cwd
  }

  private ensureReady()
  {
    if (!this._ready)
      throw new Error("NOT READY")
  }

  private updateLock()
  {
    if (!this._cwd)
      throw new Error("Working directory unknown");
    const file = path.join(this._cwd, '.opti-props.lock')
    const data: {propertyName: string, propertyType: string}[] = [];
    for ( const [entryKey,entryValue] of super.entries())
      data.push({ propertyName: entryKey, propertyType: entryValue })
    const raw = JSON.stringify(data, undefined, '  ')
    fs.writeFileSync(file, raw, { encoding: 'utf-8' })
  }

  private readLock()
  {
    try {
      if (!this._cwd)
        throw new Error("Working directory unknown");
      const file = path.join(this._cwd, '.opti-props.lock')
      const raw = fs.readFileSync(file, { encoding: 'utf-8'})
      const data = raw.length > 0 ? JSON.parse(raw) : []
      if (!Array.isArray(data))
        throw new Error(`Invalid lock file at ${ file }`)
      for (const itm of data.filter(this.isMapData))
        super.set(itm.propertyName, itm.propertyType)
    } catch (e: any) {
      if (e.code === 'ENOENT')
        return []
      throw e
    }
  }

  private isMapData(v: any): v is {propertyName: string, propertyType: string}
  {
    if (typeof(v)!=='object' || v === null)
      return false;
    return typeof(v.propertyName) === 'string' && typeof(v.propertyType) ==='string'
  }

  has(key: string): boolean {
    this.ensureReady()
    return super.has(key)
  }

  set(key: string, value: string): this {
    this.ensureReady()
    const cv = super.get(key)
    if (cv !== value) {
      super.set(key,value)
      this.updateLock()
    }
    return this
  }

  get(key: string): string | undefined {
    this.ensureReady()
    return super.get(key)
  }

  delete(key: string): boolean {
    this.ensureReady()
    const res = super.delete(key)
    this.updateLock()
    return res
  }

  clear(): void {
    this.ensureReady()
    super.clear()
    this.updateLock()
  }
}

const collisionTracker: PropertyCollisionTracker = new PropertyCollisionTracker()

const ContentTypeLoader: LoaderFunction = async (documentUri, config) => {
  collisionTracker.cwd = config.cwd;

  const parsedData = parseVirtualLocation(documentUri)
  if (!parsedData)
    return undefined

  const { type: loaderType, contentTypeBase: baseType, contentTypeKey, forProperty: isForProperty } = parsedData

  let rawSDL: string|undefined;
  if (loaderType === "target") {
    rawSDL = buildInjectionTarget(`_${ contentTypeKey }`)
  } else {
    const contentType = await OptiCMS.getContentType(contentTypeKey)
    if (!contentType)
      throw new Error(`ContentType with key ${baseType} cannot be loaded`)

    if (contentType.baseType !== baseType)
      throw new Error(`ContentType base types don't match, expected ${baseType} but received ${contentType.baseType}`)

    rawSDL = loaderType === 'fragment' ?
      buildFragment(contentType, (name) => '_' + name, isForProperty, collisionTracker) :
      buildGetQuery(contentType, (name) => '_' + name, collisionTracker)
  }

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
export function getGraphPropertyType(contentType: IntegrationApi.ContentType): string {
  return (contentType.key ? contentType.key : "_IContent") + "Property"
}

export function buildInjectionTarget(injectionTarget: string) {
  return `fragment ${injectionTarget} on _IContent { ...IContentData }`
}

export function buildGetQuery(contentType: IntegrationApi.ContentType, queryName?: string | ((defaultName: string) => string), propertyTracker: Map<string,string> = new Map()) {
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

export function buildFragment(contentType: IntegrationApi.ContentType, fragmentName?: string | ((defaultName: string) => string), forProperty: boolean = false, propertyTracker: Map<string,string> = new Map()) {
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

export function buildProperty(propertyName: string, propertyConfig?: IntegrationApi.ContentTypeProperty, propertyTracker: Map<string,string> = new Map()): string | null {
  const propertyItemConfig = propertyConfig?.type === 'array' ? propertyConfig?.items ?? propertyConfig : propertyConfig
  const propertyType = propertyItemConfig?.type ?? 'any'

  // Ensure we don't have property naming collisions
  let outputPropertyName = propertyName
  if (propertyTracker.has(propertyName)) {
    if (propertyTracker.get(propertyName) != propertyType) {
      outputPropertyName = `${propertyName}${ucFirst(propertyType)}: ${propertyName}`
      propertyTracker.set(`${propertyName}${ucFirst(propertyType)}`, propertyType)
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
