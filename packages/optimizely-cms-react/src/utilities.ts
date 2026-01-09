import type { ComponentType } from 'react';
import type { DocumentNode } from 'graphql';
import type { ContentLinkWithLocale, ContentLink, VariationInput, IOptiGraphClient, InlineContentLink } from '@remkoj/optimizely-graph-client';
import type { ContentType, BaseCmsComponent, CmsComponentWithQuery, CmsComponentWithFragment, WithGqlFragment, ContentQueryProps, CmsComponentProps } from './types.js';
import type { ComponentFactory } from './factory/types.js';

import { OptiCmsSchema } from '@remkoj/optimizely-graph-client';
import { localeToGraphLocale } from '@remkoj/optimizely-graph-client/utils';

//Export the Rich-Text utilities
export * from './components/rich-text/utils.js'

/**
 * Safeguard filter to remove default properties from the CmsComponent, intended
 * to prevent these properties to be passed to client components. It will also
 * remove all properties where the name starts with a `_`.
 * 
 * @param     toFilter  The object to filter the 
 * @returns   W
 */
export function filterCmsComponentProps<T extends object>(toFilter: T): Omit<T, keyof CmsComponentProps<any>> {
  const _CmsComponentProps: Array<keyof CmsComponentProps<any>> = ['children', 'contentLink', 'ctx', 'data', 'editProps', 'inEditMode', 'layoutProps']
  function shouldKeep(currentPropName: keyof T): currentPropName is keyof Omit<T, keyof CmsComponentProps<any>> {
    if (typeof currentPropName === 'string' && currentPropName.startsWith('_'))
      return false
    if (_CmsComponentProps.includes(currentPropName as keyof CmsComponentProps<any>))
      return false
    return true
  }
  return (Object.getOwnPropertyNames(toFilter) as (keyof T)[]).reduce((newProps, currentPropName) => {
    if (shouldKeep(currentPropName))
      newProps[currentPropName] = toFilter[currentPropName];
    return newProps
  }, {} as Omit<T, keyof CmsComponentProps<any>>)
}

/**
 * 
 * 
 * @param     toTest 
 * @returns 
 */
export function isNonEmptyString(toTest: any): toTest is string {
  return typeof (toTest) == 'string' && toTest.length > 0
}

export function isNotNullOrUndefined<T>(toTest?: T | null): toTest is T {
  return !(toTest == null || toTest == undefined)
}

export function isContentType(toTest: any): toTest is ContentType {
  if (!Array.isArray(toTest))
    return false

  return toTest.every(isNonEmptyString)
}

/**
 * Normalizes the content type by:
 *  - Converting strings to ContentType
 *  - Stripping the leading underscore, if any
 * 
 * @param       toNormalize         The Content Type value to process
 * @param       stripContent        When set to true, the global base type "Content" will be removed as well
 * @returns 
 */
export function normalizeContentType(toNormalize: (string | null)[] | string | null | undefined, stripContent: boolean = false): ContentType | undefined {
  if (!toNormalize)
    return undefined

  let filtered = (typeof (toNormalize) == 'string' ? toNormalize.split('/') : toNormalize).filter(isNonEmptyString).map(x => x.startsWith('_') ? x.substring(1) : x)
  if (stripContent)
    filtered = filtered.filter(x => x.toLowerCase() != 'content')
  return filtered.length > 0 ? filtered : undefined
}

/**
 * Normalizes and prefixes the content type by:
 *  - Converting strings to ContentType
 *  - Stripping the leading underscore, if any
 *  - Removing the global base type "Content"
 *  - Ensuring that in the remaining type the least specific type is equal to the provided prefix
 * 
 * @param       contentType 
 * @param       prefix 
 * @returns 
 */
export function normalizeAndPrefixContentType(contentType: Array<string | null> | string | null | undefined, prefix: string): ContentType {
  if (!contentType)
    return [prefix]

  const processedContentType = normalizeContentType(contentType, true) ?? []
  if (processedContentType[0] != prefix)
    processedContentType.unshift(prefix)

  return processedContentType
}

/**
 * Perform the resolution of the Component, based on the type and list of 
 * variants. It will return the first matching variant, and fall back to
 * the main component if none match.
 * 
 * @param       factory     The ComponentFactory to use for the resolution 
 *                          process
 * @param       type        The Component Type to resolve
 * @param       variants    The variants to test
 * @returns     The resolved Component or undefined if not found
 */
export function resolveComponentType(factory: ComponentFactory, type: ContentType, variants: Array<string> = []) : ReturnType<ComponentFactory['resolve']>
{
  const contentTypeKey = type.at(0);
  if (contentTypeKey) {
    for (const variant of variants) {
      const variantComponent = factory.resolve(contentTypeKey, variant)
      if (variantComponent)
        return variantComponent
    }
    const mainComponent = factory.resolve(contentTypeKey)
    if (mainComponent) 
      return mainComponent;
  }
  console.warn(`❌ [Component Resolution] Unable to resolve ${ contentTypeKey } in any of the requested variants: ${ [...variants, 'default'].join(', ') }`)
  return undefined
}

export function isCmsComponentWithDataQuery<T = DocumentNode>(toTest?: BaseCmsComponent<T>): toTest is CmsComponentWithQuery<T> {
  const toTestType = typeof (toTest)
  if ((toTestType == 'function' || toTestType == 'object') && toTest != null) {
    return (toTest as CmsComponentWithQuery).getDataQuery && typeof ((toTest as CmsComponentWithQuery).getDataQuery) == 'function' ? true : false
  }
  return false
}

export function isCmsComponentWithFragment<T = DocumentNode>(toTest?: BaseCmsComponent<T>): toTest is CmsComponentWithFragment<T> {
  const toTestType = typeof (toTest)
  if ((toTestType == 'function' || toTestType == 'object') && toTest != null)
    return (toTest as CmsComponentWithFragment).getDataFragment && typeof ((toTest as CmsComponentWithFragment).getDataFragment) == 'function' ? true : false
  return false
}

export function validatesFragment<T extends ComponentType<any>>(toTest?: T): toTest is T & Pick<Required<WithGqlFragment<T, any>>, "validateFragment"> {
  type ToTestFor = T & Pick<Required<WithGqlFragment<T, any>>, "validateFragment">
  const toTestType = typeof (toTest)
  if ((toTestType == 'function' || toTestType == 'object') && toTest != null)
    return (toTest as ToTestFor).validateFragment && typeof ((toTest as ToTestFor).validateFragment) == 'function' ? true : false
  return false
}

/**
 * Take a ContentLink and transform it into the normalized set of request variables used query for content across
 * multiple components.
 * 
 * @param     contentLink     The contentlink to transform
 * @param     client          If provided, the the configuration of the client is applied to the variables
 * @returns   The request variables to use for querying Optimizely Graph
 */
export function contentLinkToRequestVariables(contentLink: ContentLinkWithLocale, client: IOptiGraphClient): ContentQueryProps {
  const gqlVariables: ContentQueryProps = {
    key: contentLink.key ?? '-no-content-selected-',
    locale: ifNonEmptyString(contentLink.locale, localeToGraphLocale),
    version: ifNonEmptyString(contentLink.version),
    changeset: ifNonEmptyString(contentLink.changeset),
    variation: ifNonEmptyString(contentLink.variation, (variation) => { return { include: "SOME", value: [variation] } as VariationInput })
  }

  // CMS 12 Requires the version number to be an Int
  if (client && client.currentOptiCmsSchema == OptiCmsSchema.CMS12)
    gqlVariables.version = tryParsePositiveInt(gqlVariables.version) as unknown as string | undefined

  // If the CMS Preview mode has been enabled, make sure we include that specific
  // changeset in the query. This overrides the changeset that my be inferred from
  // the contentLink
  if (client && client.isPreviewEnabled())
    gqlVariables.changeset = client.getChangeset()

  // Make sure we can load any version by releasing access to any variation when a
  // version has been explicitly requested. If no version has been requested, the
  // variation will not be modified from the contentLink.
  if (gqlVariables.version)
    gqlVariables.variation = { include: "ALL" }

  // Return the processed outcome
  return gqlVariables
}

/**
 * Normalizes a string|null|undefined input to a non-empty string or undefined. This ensures that a
 * non-empty string is considered insignificant and will not yield an empty result. When provided,
 * the transformer function is applied *after* the non-empty check and the outcome of the transformer
 * is returned.
 * 
 * @param     inputValue    The current value to check
 * @param     transformer   The transformer to apply to a non-empty string value
 * @returns   The output of the transformer when the input is a non-empty string, `undefined` otherwise
 */
export function ifNonEmptyString<T = string>(inputValue?: string | null, transformer: (iv: string) => T = (iv: string) => iv as T): T | undefined {
  return inputValue && typeof (inputValue) == 'string' && inputValue.length > 0 ? transformer(inputValue) : undefined
}

export function toUniqueValues<R extends any>(value: R, index: number, array: Array<R>): value is R {
  return array.indexOf(value) == index
}

export function trim<T extends string | null | undefined>(valueToTrim: T): T {
  if (typeof (valueToTrim) == 'string')
    return valueToTrim.trim() as T
  return valueToTrim
}

/**
 * Extract the identifier needed for the edit HTML properties from the contentLink. This will ensure 
 * that inline content links don't output an identifier.
 * 
 * @param contentLink 
 * @returns 
 */
export function getContentEditId(contentLink?: ContentLink | InlineContentLink | null): string | undefined {
  if (!contentLink?.key || contentLink.key.length == 0)
    return undefined
  return contentLink.key
}

/**
 * Generate a pseudo-random identifier usable to satisfy the unique key 
 * requirement for children within a React node. However this effectively will
 * tell React that the childrend will be unique for each render and thus cause
 * them to update.
 * 
 * Only use this method to generate keys if there's no other way to test the
 * uniqueness of the child
 * 
 * @param       prefix      The prefix to apply to the children
 * @returns     The unique key
 */
export function getRandomKey(prefix: string = "rnd"): string {
  try {
    return `${prefix}::${crypto.randomUUID()}`
  } catch {
    return `${prefix}::${Math.round(Math.random() * 10000)}::${Math.round(Math.random() * 10000)}`
  }
}

/**
 * Parse the provided string to determine if it's a valid positive (i.e. larger then 0) number,
 * return the number if it is, `undefined` or the `defaultValue` otherwise. 
 * 
 * @param     value 
 * @param     defaultValue 
 * @returns   
 */
export function tryParsePositiveInt(value: string | undefined | null, defaultValue?: number) {
  try {
    const versionNr = value ? Number.parseInt(value) : 0
    if (!isNaN(versionNr) && versionNr > 0)
      return versionNr
  } catch {
    // Ignore
  }
  return defaultValue
}
