import type { ContentLink, ContentLinkWithLocale, InlineContentLink, InlineContentLinkWithLocale } from "./types.js"

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

  // The object must have a key, string, miniumum length 1 char
  return typeof ((toTest as ContentLink).key) == 'string' && ((toTest as ContentLink).key as string).length > 0
}

export function isContentLinkWithLocale(toTest: any): toTest is ContentLinkWithLocale {
  if (!isContentLink(toTest))
    return false

  const locale = (toTest as ContentLinkWithLocale).locale
  return locale == undefined || locale == null || (typeof (locale) == 'string' && locale.length >= 2 && locale.length <= 5)
}

/**
 * Test if the variable is an 
 * 
 * @param toTest 
 * @returns 
 */
export function isInlineContentLink(toTest: any): toTest is InlineContentLinkWithLocale {
  if (typeof toTest != 'object' || toTest == null)
    return false

  if ((toTest as InlineContentLinkWithLocale).isInline === true)
    return true

  return ((toTest as InlineContentLinkWithLocale).key == null || (toTest as ContentLinkWithLocale).key == "" || (toTest as InlineContentLinkWithLocale).key == undefined) &&
    ((toTest as InlineContentLinkWithLocale).version == null || (toTest as InlineContentLinkWithLocale).version == undefined) &&
    (typeof (toTest as InlineContentLinkWithLocale).locale == 'string' || (toTest as InlineContentLinkWithLocale).locale == null || (toTest as InlineContentLinkWithLocale).locale == undefined)
}

type Nullable<T> = {
  [K in keyof T]?: T[K] | null
} | null | undefined

/**
 * Take the normalizable value
 * 
 * @param toNormalize 
 * @returns 
 */
export function normalizeContentLink(toNormalize: Nullable<ContentLink | InlineContentLink>): ContentLink | InlineContentLink | undefined {
  if (!(isContentLink(toNormalize) || isInlineContentLink(toNormalize)))
    return undefined

  const newLink: ContentLink | InlineContentLink = {
    key: toNormalize.key
  }
  if (toNormalize.version)
    newLink.version = toNormalize.version.toString()

  return toNormalize
}

export function normalizeContentLinkWithLocale<LT = string>(toNormalize: Nullable<ContentLinkWithLocale<LT>>): ContentLinkWithLocale<LT> | undefined {
  const normalized = normalizeContentLink(toNormalize) as ContentLinkWithLocale<LT>
  if (toNormalize?.locale != undefined && !(typeof (toNormalize?.locale) == 'string' && (toNormalize.locale.length == 2 || toNormalize.locale.length == 5)))
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