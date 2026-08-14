import type { IntegrationApi } from "@remkoj/optimizely-cms-api"
import { isNonEmptyString } from "../tools"

/** Options controlling what kind of virtual document URI is built or parsed. */
export type VirtualLocationOptions = { forProperty: boolean, type: 'fragment' | 'query' | 'target' }
/**
 * Parsed representation of an `opti-cms:/` virtual URI, containing all data
 * needed to generate the corresponding GraphQL fragment or query.
 */
export type VirtualLocationData = { contentTypeBase: string, contentTypeKey: string, injectionTargets: Array<string> } & VirtualLocationOptions
const DefaultVirtualLocationOptions: VirtualLocationOptions = { forProperty: false, type: 'fragment' }

/**
 * The set of named injection targets where generated component fragments are
 * inserted into the default Optimizely Graph queries.
 *
 * When the codegen preset builds the master GraphQL queries it leaves a spread
 * placeholder at each target location. For every content type it then generates
 * a fragment and injects that fragment into the right placeholder based on the
 * content type's `baseType` and `compositionBehaviors`. The result is a single
 * query that fetches all content data in one round-trip to Optimizely Graph.
 *
 * You normally do not need to pick targets manually — `build()` selects the
 * correct ones automatically. However, you can reference these values in the
 * `injections` option of the codegen preset when you want to manually wire a
 * GraphQL file to a specific placeholder in the generated queries.
 */
export enum ContentTypeTarget {
  /**
   * Placeholder for Visual Builder **section layout** types (content types
   * whose `baseType` is `_section`). Sections act as structural containers
   * inside a Visual Builder experience and are distinct from regular blocks.
   */
  'SectionData' = 'SectionData',
  /**
   * Placeholder for **page and experience** types (content types whose
   * `baseType` is `_page` or `_experience`). These are the top-level content
   * items that map directly to a URL in your Next.js site.
   */
  'PageData' = 'PageData',
  /**
   * Placeholder for **media asset** types such as images, videos, and generic
   * file assets (content types whose `baseType` is `_media`, `_image`, or
   * `_video`).
   */
  'MediaData' = 'MediaData',
  /**
   * Placeholder for **general-purpose component** types — blocks and other
   * renderable components that do not exclusively carry element or section
   * behaviors. This is the most common target and should only be used for
   * components that are truely usable across locations.
   */
  'ComponentData' = 'ComponentData',
  /**
   * Placeholder for component types that carry the **`elementEnabled`**
   * composition behavior. These components can be placed as individual
   * elements inside a Visual Builder experience, regardless of whether they
   * are also section- or form-enabled.
   */
  'ElementData' = 'ElementData',
  /**
   * Placeholder for component types that carry the **`sectionEnabled`**
   * composition behavior. These elements can be dropped inside a Visual
   * Builder section as child items.
   */
  'SectionElementData' = 'SectionElementData',
  /**
   * Placeholder for component types that carry the **`formsElementEnabled`**
   * composition behavior. These are the individual field and widget types
   * that make up an Optimizely Forms form.
   */
  'FormElementData' = 'FormElementData',
  /** @deprecated Use `ComponentData` instead. */
  'BlockData' = 'BlockData',
}

/**
 * The URI protocol scheme used by all virtual `opti-cms:/` document URIs
 * that are handled by this module's loaders.
 */
export const OptiCmsProtocol = 'opti-cms:';

/**
 * Return `true` when `toTest` is an `opti-cms:/` virtual location URI that
 * can be handled by this module.
 *
 * @param toTest  Any value; safe to call with `unknown` input
 * @returns       `true` for strings or `URL` objects whose protocol is `opti-cms:`
 */
export function isOptiCmsURL(toTest: unknown): toTest is string|URL
{
  if (typeof(toTest) === 'string') {
    return toTest.startsWith(OptiCmsProtocol+'/');
  }
  if (typeof(toTest) === 'object' && toTest !== null && toTest.constructor === URL)
  {
    return (toTest as URL).protocol === OptiCmsProtocol;
  }
  return false;
}

/**
 * Return the names of all supported injection targets where component
 * fragments may be inserted within the default Optimizely Graph queries.
 *
 * @returns Array of `ContentTypeTarget` enum member names
 */
export function getInjectionTargets(): ReadonlyArray<string> {
  return Object.getOwnPropertyNames(ContentTypeTarget)
}

/**
 * Parse an `opti-cms:/` virtual URI into the configuration needed to generate
 * the corresponding GraphQL fragment or query.
 *
 * Supported path forms:
 * - `opti-cms:/contenttypes/<baseType>[.property]/<key>[/<target>...]` — fragment
 * - `opti-cms:/contentquery/<baseType>/<key>`                           — get-query
 * - `opti-cms:/injectiontarget/<name>`                                  — injection target
 *
 * @param   virtualPath   The virtual URI to parse
 * @returns               Parsed configuration, or `undefined` when the URI is not recognised
 */
export function parse(virtualPath: string): VirtualLocationData | undefined {
  if (!virtualPath.startsWith(OptiCmsProtocol+'/'))
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

/**
 * Build an `opti-cms:/injectiontarget/<name>` URI for a named injection target.
 */
export function build(injectionFragment: string): string
/**
 * Build an `opti-cms:/` virtual URI for the given content type.
 *
 * Returns `undefined` when the content type cannot produce a valid URI (missing
 * key, Graph-sourced, `SysContentFolder`, or a contract type).
 *
 * @param contentType  The content type definition from the CMS API
 * @param options      Override `forProperty` or `type`; defaults to a non-property fragment URI
 */
export function build(contentType: IntegrationApi.ContentType, options?: Partial<VirtualLocationOptions>): string | undefined
export function build(contentType: IntegrationApi.ContentType|string, options?: Partial<VirtualLocationOptions>) : string | undefined {
  if (typeof(contentType) === 'string') 
    return `${OptiCmsProtocol}/injectiontarget/${contentType}`
  
  const { forProperty, type } = { ...DefaultVirtualLocationOptions, ...options };
  const basePath = type == 'fragment' ? 'contenttypes' : 'contentquery'
  const ctKey = contentType.key
  if (!ctKey || ctKey === 'SysContentFolder' || isGraphType(contentType) || isContract(contentType))
    return undefined
  const baseType = extractBaseType(contentType)
  return forProperty ?
    `${OptiCmsProtocol}/${basePath}/${baseType}.property/${ctKey}` :
    `${OptiCmsProtocol}/${basePath}/${baseType}/${ctKey}/${getContentTypeTargets(contentType).join('/')}`
}

/** Returns `true` when `contentType` is marked as a contract. */
function isContract<T extends IntegrationApi.ContentType>(contentType: T): boolean
{
  if (!contentType || typeof(contentType) !== 'object') 
    return false;
  if (contentType.isContract === true)
    return true;
  if (contentType.source === 'globalcontracts')
    return true;
  return false;
}

/** Returns `true` when `contentType` is marked as being a type imported from graph.  */
function isGraphType<T extends IntegrationApi.ContentType>(contentType: T): boolean
{
  return (contentType.source === 'graph' || contentType.key?.startsWith('graph:')) ?? false;
}

/** Normalise a stored base-type string to the `_<name>` convention used in CMS API responses. */
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

/** Strip leading underscores from `contentType.baseType`, falling back to `fallback` when absent. */
function extractBaseType(contentType: IntegrationApi.ContentType, fallback: string = 'cms'): string {
  return (contentType.baseType ?? fallback).replace(/^_+/, '')
}

/**
 * Map a content type's base type to the list of `ContentTypeTarget` injection targets
 * where its fragment should be inserted. ContentTypes that are a contract, or are
 * imported from Graph will be rejected.
 */
function getContentTypeTargets(contentType: IntegrationApi.ContentType): ContentTypeTarget[] {
  if (
    !contentType.key || 
    isContract(contentType) ||
    isGraphType(contentType)
  )
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
      // All components, except the built-in form elements can potentially
      // be used within an content-area. So we're including them in the
      // ComponentData target.
      if (!isBuildInFormElement(contentType))
        injections.push(ContentTypeTarget.ComponentData)

      // Now ensure that the targets for elements, sections and formElements
      // are properly filled.
      const usage = contentType.compositionBehaviors ?? []
      if (usage.includes('elementEnabled')) injections.push(ContentTypeTarget.ElementData)
      if (usage.includes('sectionEnabled')) injections.push(ContentTypeTarget.SectionElementData)
      if (usage.includes('formsElementEnabled')) injections.push(ContentTypeTarget.FormElementData)

      break;
    }
    default:
      console.warn(`⚠️  [OPTIMIZELY] Content type ${ contentType.key ?? '' } has an unknown base type ${ baseType }, assuming it's an component.`);
      injections.push(ContentTypeTarget.ComponentData)
      break;
  }

  return injections
}

function isBuildInFormElement(contentType: IntegrationApi.ContentType): boolean {
  const usage = contentType.compositionBehaviors ?? []
  const source = contentType.source

  return source === '_server' && usage.length === 1 && usage[0] === 'formsElementEnabled';
}