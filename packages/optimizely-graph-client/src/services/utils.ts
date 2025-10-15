import type { ContentLink, ContentLinkWithLocale, InlineContentLink, InlineContentLinkWithLocale } from "./types.js"
export type { ContentLink, ContentLinkWithLocale, InlineContentLink, InlineContentLinkWithLocale } from "./types.js"

/**
 * Transform a locale code (e.g. en-US) to a Optimizely Graph compatible locale
 * (e.g. en_US).
 * 
 * @param       locale          The locale to transform
 * @returns     The Optimizely Graph safe locale
 */
export function localeToGraphLocale<T>(locale: T): T extends string ? string : never {
  if (typeof (locale) != 'string' || (locale.length != 2 && locale.length != 5 && locale != 'ALL' && locale != 'NEUTRAL'))
    throw new Error(`The value ${locale} is not a supported ISO locale`)
  return locale.replaceAll('-', '_') as T extends string ? string : never
}

/**
 * Tranform an Optimizely Graph locale (e.g. en_US) to an ISO locale (e.g. en-US)
 * 
 * @param       graphLocale     The locale as supported by Optimizely Graph
 * @returns     The ISO Locale
 */
export function graphLocaleToLocale<T>(graphLocale: T): T extends string ? string : never {
  if (typeof (graphLocale) != 'string' || (graphLocale.length != 2 && graphLocale.length != 5 && graphLocale != 'ALL' && graphLocale != 'NEUTRAL'))
    throw new Error(`The value ${graphLocale} is not a supported ISO locale`)
  return graphLocale.replaceAll('_', '-') as T extends string ? string : never
}

/**
 * Check if two ContentLinks point to the same content item, if either of the
 * links set the version or locale, these values must be equal across the ContentLinks
 * 
 * @param       link1       The first compared link
 * @param       link2       The second compared link
 * @returns     True if they links point to the same content item, False otherwise
 */
export function contentLinkIsEqual(link1: ContentLink | ContentLinkWithLocale, link2: ContentLink | ContentLinkWithLocale): boolean {
  if (link1.key != link2.key)
    return false
  if ((link1.version || link2.version) && link1.version != link2.version)
    return false
  if (((link1 as ContentLinkWithLocale).locale || (link2 as ContentLinkWithLocale).locale) && (link1 as ContentLinkWithLocale).locale != (link2 as ContentLinkWithLocale).locale)
    return false
  return true
}

/**
 * Check if two ContentLinks point to the same content item, if either of the
 * links set the version or locale, these values must be equal across the ContentLinks
 * 
 * @param       link1       The first compared link
 * @param       link2       The second compared link
 * @returns     True if they links point to the same content item, False otherwise
 */
export function contentLinkIsEqualIgnoreVersion(link1: ContentLink | ContentLinkWithLocale, link2: ContentLink | ContentLinkWithLocale): boolean {
  if (link1.key != link2.key)
    return false
  if (((link1 as ContentLinkWithLocale).locale || (link2 as ContentLinkWithLocale).locale) && (link1 as ContentLinkWithLocale).locale != (link2 as ContentLinkWithLocale).locale)
    return false
  return true
}

/**
 * Test if the provided value can be understood as a ContentLink
 * 
 * @param       toTest      The value under test
 * @returns     True if the object can be understood as a ContentLink, False otherwise
 */
export function isContentLink(toTest: any): toTest is ContentLink {
  // It must be an object
  if (typeof (toTest) != 'object' || toTest == null)
    return false

  // Check if this is an explicit inline content item
  if ((toTest as ContentLink).isInline === true)
    return false

  // The object must have a key, string, miniumum length 1 char
  return typeof ((toTest as ContentLink).key) == 'string' && ((toTest as ContentLink).key as string).length > 0
}

export function isContentLinkWithLocale(toTest: any): toTest is ContentLinkWithLocale {
  if (!isContentLink(toTest))
    return false

  const locale = (toTest as ContentLinkWithLocale).locale
  return locale == undefined || locale == null || (typeof (locale) == 'string' && locale.length >= 2 && locale.length <= 5)
}

export function isContentLinkWithSetLocale<LocaleType = string>(toTest: any): toTest is ContentLink & { locale: LocaleType } {
  if (!isContentLink(toTest))
    return false

  const locale = (toTest as ContentLinkWithLocale).locale
  return typeof (locale) == 'string' && locale.length >= 2 && locale.length <= 5
}

/**
 * Test if the variable is an inline content link
 * 
 * @param toTest 
 * @returns 
 */
export function isInlineContentLink(toTest: any): toTest is InlineContentLinkWithLocale {
  if (typeof toTest != 'object' || toTest == null)
    return false

  if ((toTest as InlineContentLinkWithLocale).isInline === true)
    return true

  return (
    isNullOrEmptyString((toTest as InlineContentLinkWithLocale).key) &&
    isNullOrEmpty((toTest as InlineContentLinkWithLocale).version) &&
    isOptionalString((toTest as InlineContentLinkWithLocale).locale)
  )
}

/**
 * Test if a value is null, undefined or an empty string
 * 
 * @param     value 
 * @returns 
 */
function isNullOrEmptyString(value: any): value is string | null | undefined {
  if (value === null || value === undefined)
    return true;
  return typeof (value) == 'string' && value == "";
}

/**
 * Simple inverse boolean coescaling. I.e. it returns true when the value
 * is not set, null or evaluates to false (e.g. empty string, numeric 0, etc...)
 * 
 * @param value 
 * @returns 
 */
function isNullOrEmpty<T>(value: T | null | undefined): value is T {
  return value ? false : true
}

/**
 * Test if a value is null, undefined or a string of any length
 * 
 * @param value 
 * @returns 
 */
function isOptionalString(value: any): value is string | null | undefined {
  return value === null || value === undefined || typeof (value) == 'string';
}

type Nullable<T> = {
  [K in keyof T]?: T[K] | null
} | null | undefined

/**
 * Take the input object and ensure that only the properties within ContentLink are actually 
 * retained.
 * 
 * @param     toNormalize 
 * @returns   
 */
export function normalizeContentLink(toNormalize: Nullable<ContentLink | InlineContentLink>): ContentLink | InlineContentLink | undefined {
  const newLink = isContentLink(toNormalize) ? {
    key: toNormalize.key,
    isInline: false,
    changeset: toNormalize.changeset ?? undefined,
    variation: toNormalize.variation ?? undefined,
    version: toNormalize.version ? toNormalize.version.toString() : undefined
  } as ContentLink : (isInlineContentLink(toNormalize) ? {
    key: null,
    isInline: true,
    changeset: toNormalize.changeset ?? undefined,
    variation: toNormalize.variation ?? undefined
  } as InlineContentLink : undefined)
  return newLink
}

export function normalizeContentLinkWithLocale<LT = string>(toNormalize: Nullable<ContentLinkWithLocale<LT>>): ContentLinkWithLocale<LT> | InlineContentLinkWithLocale<LT> | undefined {
  const normalized = normalizeContentLink(toNormalize) as ContentLinkWithLocale<LT> | InlineContentLinkWithLocale<LT> | undefined
  if (normalized && typeof (toNormalize?.locale) == 'string' && (toNormalize.locale.length == 2 || toNormalize.locale.length == 5))
    normalized.locale = toNormalize.locale
  return normalized
}

function generateUniqueKey(prefix: string = "inline::") {
  try {
    return prefix + crypto.randomUUID().replaceAll('-', '')
  } catch (e) {
    console.warn("💥 Crypto library unavailable, expect key collisions")
    return prefix + 'default'
  }
}

/**
 * Create a textual representation of a content link
 * 
 * @param       contentLink     The (inline) content link to transform to a string
 * @param       unique          Set to true to ensure that this method returns a string that can be used as key
 * @returns     The textual representation of the ContentLink
 */
export function contentLinkToString(contentLink: ContentLink | InlineContentLink | null | undefined, unique: boolean = false): string {
  if (!contentLink)
    return unique ? generateUniqueKey('no-content::') : '[no content]'
  return [
    contentLink.key == null ? (unique ? generateUniqueKey() : "[inline content]") : contentLink.key,
    contentLink.version,
    (contentLink as ContentLinkWithLocale).locale
  ].filter(x => x).join('::')
}