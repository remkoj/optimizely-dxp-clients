import type { IntegrationApi } from "@remkoj/optimizely-cms-api"
import { isNonEmptyString } from "./tools"

export type VirtualLocationOptions = { forProperty: boolean, type: 'fragment' | 'query' | 'target' }
export type VirtualLocationData = { contentTypeBase: string, contentTypeKey: string, injectionTargets: Array<string> } & VirtualLocationOptions
const DefaultVirtualLocationOptions: VirtualLocationOptions = { forProperty: false, type: 'fragment' }

/**
 * The list of injection targets where fragments may be injected within the
 * default queries.
 */
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

/**
 * Get a list of names of all supported injection targets, where fragments may be 
 * injected within the default queries.
 * 
 * @returns The list of names
 */
export function getInjectionTargets() {
  return Object.getOwnPropertyNames(ContentTypeTarget)
}

/**
 * Take an `opti-cms:/` virtual path and parse it to get the configuraiton of
 * the fragment/query to be generated.
 * 
 * @param     virtualPath   The virtual path
 * @returns   The fragment/query configuration
 */
export function parseVirtualLocation(virtualPath: string): VirtualLocationData | undefined {
  if (!virtualPath.startsWith('opti-cms:/'))
    return undefined
  const virtualURL = new URL(virtualPath)
  const [basePath, baseType, ctKey, ...targets] = virtualURL.pathname.split('/').filter(isNonEmptyString);

  // Validate the basepath
  if (!['contenttypes', 'contentquery', 'injectiontarget'].includes(basePath))
    return undefined

  if (basePath === 'injectiontarget') {
    return {
      type: 'target',
      contentTypeBase: '',
      contentTypeKey: baseType,
      forProperty: false,
      injectionTargets: []
    }
  }

  const type = basePath == "contenttypes" ? 'fragment' : 'query';
  const forProperty = baseType.endsWith('.property')
  const contentTypeBase = parseBaseType(forProperty ? baseType.substring(0, baseType.length - 9) : baseType);
  const contentTypeKey = ctKey;
  const injectionTargets = targets
  return { type, contentTypeBase, contentTypeKey, injectionTargets, forProperty }
}

export function buildVirtualLocation(injectionFragment: string): string
export function buildVirtualLocation(contentType: IntegrationApi.ContentType, options?: Partial<VirtualLocationOptions>): string | undefined
export function buildVirtualLocation(contentType: IntegrationApi.ContentType|string, options?: Partial<VirtualLocationOptions>) : string | undefined {
  if (typeof(contentType) === 'string') 
    return `opti-cms:/injectiontarget/${contentType}`
  
  const { forProperty, type } = { ...DefaultVirtualLocationOptions, ...options };
  const basePath = type == 'fragment' ? 'contenttypes' : 'contentquery'
  const ctKey = contentType.key
  if (!ctKey || contentType.source === 'graph' || ctKey === 'SysContentFolder' || isContract(contentType))
    return undefined
  const baseType = extractBaseType(contentType)
  return forProperty ?
    `opti-cms:/${basePath}/${baseType}.property/${ctKey}` :
    `opti-cms:/${basePath}/${baseType}/${ctKey}/${getContentTypeTargets(contentType).join('/')}`
}

type WithIsContract<T> = T & { isContract: boolean }
function hasContractInfo<T>(toTest: T): toTest is WithIsContract<T>
{
  if (typeof(toTest) !== 'object' || toTest === null)
    return false;
  return typeof((toTest as WithIsContract<T>).isContract) === 'boolean'
}
function isContract<T>(contentType: T): boolean
{
  return hasContractInfo(contentType) ? contentType.isContract : false
}

function parseBaseType(storedBaseType: string) {
  switch (storedBaseType.toLowerCase()) {
    case 'section':
    case 'media':
    case 'component':
    case 'experience':
    case 'page':
    case 'image':
    case 'video':
      return '_' + storedBaseType;
    default:
      return storedBaseType;
  }
}

function extractBaseType(contentType: IntegrationApi.ContentType, fallback: string = 'cms'): string {
  return (contentType.baseType ?? fallback).replace(/^_+/, '')
}


function getContentTypeTargets(contentType: IntegrationApi.ContentType): ContentTypeTarget[] {
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
