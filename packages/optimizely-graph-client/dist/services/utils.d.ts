import type { ContentLink, ContentLinkWithLocale } from "./types.js";
/**
 * Transform a locale code (e.g. en-US) to a Optimizely Graph compatible locale
 * (e.g. en_US).
 *
 * @param       locale          The locale to transform
 * @returns     The Optimizely Graph safe locale
 */
export declare function localeToGraphLocale<T>(locale: T): T extends string ? string : never;
/**
 * Tranform an Optimizely Graph locale (e.g. en_US) to an ISO locale (e.g. en-US)
 *
 * @param       graphLocale     The locale as supported by Optimizely Graph
 * @returns     The ISO Locale
 */
export declare function graphLocaleToLocale<T>(graphLocale: T): T extends string ? string : never;
/**
 * Check if two ContentLinks point to the same content item, if either of the
 * links set the version or locale, these values must be equal across the ContentLinks
 *
 * @param       link1       The first compared link
 * @param       link2       The second compared link
 * @returns     True if they links point to the same content item, False otherwise
 */
export declare function contentLinkIsEqual(link1: ContentLink | ContentLinkWithLocale, link2: ContentLink | ContentLinkWithLocale): boolean;
/**
 * Check if two ContentLinks point to the same content item, if either of the
 * links set the version or locale, these values must be equal across the ContentLinks
 *
 * @param       link1       The first compared link
 * @param       link2       The second compared link
 * @returns     True if they links point to the same content item, False otherwise
 */
export declare function _contentLinkIsEqualIgnoreVersion(link1: ContentLink | ContentLinkWithLocale, link2: ContentLink | ContentLinkWithLocale): boolean;
/**
 * Test if the provided value can be understood as a ContentLink
 *
 * @param       toTest      The value under test
 * @returns     True if the object can be understood as a ContentLink, False otherwise
 */
export declare function isContentLink(toTest: any): toTest is ContentLink;
export declare function _isContentLinkWithLocale(toTest: any): toTest is ContentLinkWithLocale;
type Nullable<T> = {
    [K in keyof T]?: T[K] | null;
} | null | undefined;
/**
 * Take the normalizable value
 *
 * @param toNormalize
 * @returns
 */
export declare function normalizeContentLink(toNormalize: Nullable<ContentLink>): ContentLink | undefined;
export declare function normalizeContentLinkWithLocale<LT = string>(toNormalize: Nullable<ContentLinkWithLocale<LT>>): ContentLinkWithLocale<LT> | undefined;
export declare function contentLinkToString(contentLink: ContentLink): string;
export {};
