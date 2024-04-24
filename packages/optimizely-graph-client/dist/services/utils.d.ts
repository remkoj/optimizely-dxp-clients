import type { ContentLink, ContentLinkWithLocale, InlineContentLink, InlineContentLinkWithLocale } from "./types.js";
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
export declare function contentLinkIsEqualIgnoreVersion(link1: ContentLink | ContentLinkWithLocale, link2: ContentLink | ContentLinkWithLocale): boolean;
/**
 * Test if the provided value can be understood as a ContentLink
 *
 * @param       toTest      The value under test
 * @returns     True if the object can be understood as a ContentLink, False otherwise
 */
export declare function isContentLink(toTest: any): toTest is ContentLink;
export declare function isContentLinkWithLocale(toTest: any): toTest is ContentLinkWithLocale;
/**
 * Test if the variable is an
 *
 * @param toTest
 * @returns
 */
export declare function isInlineContentLink(toTest: any): toTest is InlineContentLinkWithLocale;
type Nullable<T> = {
    [K in keyof T]?: T[K] | null;
} | null | undefined;
/**
 * Take the normalizable value
 *
 * @param toNormalize
 * @returns
 */
export declare function normalizeContentLink(toNormalize: Nullable<ContentLink | InlineContentLink>): ContentLink | InlineContentLink | undefined;
export declare function normalizeContentLinkWithLocale<LT = string>(toNormalize: Nullable<ContentLinkWithLocale<LT>>): ContentLinkWithLocale<LT> | undefined;
/**
 * Create a textual representation of a content link
 *
 * @param       contentLink     The (inline) content link to transform to a string
 * @param       unique          Set to true to ensure that this method returns a string that can be used as key
 * @returns     The textual representation of the ContentLink
 */
export declare function contentLinkToString(contentLink: ContentLink | InlineContentLink | null | undefined, unique?: boolean): string;
export {};
