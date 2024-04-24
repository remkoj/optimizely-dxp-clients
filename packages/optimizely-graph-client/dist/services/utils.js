/**
 * Transform a locale code (e.g. en-US) to a Optimizely Graph compatible locale
 * (e.g. en_US).
 *
 * @param       locale          The locale to transform
 * @returns     The Optimizely Graph safe locale
 */
export function localeToGraphLocale(locale) {
    if (typeof (locale) != 'string' || (locale.length != 2 && locale.length != 5))
        throw new Error(`The value ${locale} is not a supported ISO locale`);
    return locale.replaceAll('-', '_');
}
/**
 * Tranform an Optimizely Graph locale (e.g. en_US) to an ISO locale (e.g. en-US)
 *
 * @param       graphLocale     The locale as supported by Optimizely Graph
 * @returns     The ISO Locale
 */
export function graphLocaleToLocale(graphLocale) {
    if (typeof (graphLocale) != 'string' || (graphLocale.length != 2 && graphLocale.length != 5))
        throw new Error(`The value ${graphLocale} is not a supported ISO locale`);
    return graphLocale.replaceAll('_', '-');
}
/**
 * Check if two ContentLinks point to the same content item, if either of the
 * links set the version or locale, these values must be equal across the ContentLinks
 *
 * @param       link1       The first compared link
 * @param       link2       The second compared link
 * @returns     True if they links point to the same content item, False otherwise
 */
export function contentLinkIsEqual(link1, link2) {
    if (link1.key != link2.key)
        return false;
    if ((link1.version || link2.version) && link1.version != link2.version)
        return false;
    if ((link1.locale || link2.locale) && link1.locale != link2.locale)
        return false;
    return true;
}
/**
 * Check if two ContentLinks point to the same content item, if either of the
 * links set the version or locale, these values must be equal across the ContentLinks
 *
 * @param       link1       The first compared link
 * @param       link2       The second compared link
 * @returns     True if they links point to the same content item, False otherwise
 */
export function contentLinkIsEqualIgnoreVersion(link1, link2) {
    if (link1.key != link2.key)
        return false;
    if ((link1.locale || link2.locale) && link1.locale != link2.locale)
        return false;
    return true;
}
/**
 * Test if the provided value can be understood as a ContentLink
 *
 * @param       toTest      The value under test
 * @returns     True if the object can be understood as a ContentLink, False otherwise
 */
export function isContentLink(toTest) {
    // It must be an object
    if (typeof (toTest) != 'object' || toTest == null)
        return false;
    // The object must have a key, string, miniumum length 1 char
    return typeof (toTest.key) == 'string' && toTest.key.length > 0;
}
export function isContentLinkWithLocale(toTest) {
    if (!isContentLink(toTest))
        return false;
    const locale = toTest.locale;
    return locale == undefined || locale == null || (typeof (locale) == 'string' && locale.length >= 2 && locale.length <= 5);
}
/**
 * Test if the variable is an
 *
 * @param toTest
 * @returns
 */
export function isInlineContentLink(toTest) {
    if (typeof toTest != 'object' || toTest == null)
        return false;
    return toTest.key == null &&
        (toTest.version == null || toTest.version == undefined) &&
        (typeof toTest.locale == 'string' || toTest.locale == null || toTest.locale == undefined);
}
/**
 * Take the normalizable value
 *
 * @param toNormalize
 * @returns
 */
export function normalizeContentLink(toNormalize) {
    if (!(isContentLink(toNormalize) || isInlineContentLink(toNormalize)))
        return undefined;
    const newLink = {
        key: toNormalize.key
    };
    if (toNormalize.version)
        newLink.version = toNormalize.version.toString();
    return toNormalize;
}
export function normalizeContentLinkWithLocale(toNormalize) {
    const normalized = normalizeContentLink(toNormalize);
    if (toNormalize?.locale != undefined && !(typeof (toNormalize?.locale) == 'string' && (toNormalize.locale.length == 2 || toNormalize.locale.length == 5)))
        normalized.locale = toNormalize.locale;
    return normalized;
}
function generateUniqueKey(prefix = "inline::") {
    try {
        return prefix + crypto.randomUUID().replaceAll('-', '');
    }
    catch (e) {
        console.warn("💥 Crypto library unavailable, expect key collisions");
        return prefix + 'default';
    }
}
/**
 * Create a textual representation of a content link
 *
 * @param       contentLink     The (inline) content link to transform to a string
 * @param       unique          Set to true to ensure that this method returns a string that can be used as key
 * @returns     The textual representation of the ContentLink
 */
export function contentLinkToString(contentLink, unique = false) {
    if (!contentLink)
        return unique ? generateUniqueKey('no-content::') : '[no content]';
    return [
        contentLink.key == null ? (unique ? generateUniqueKey() : "[inline content]") : contentLink.key,
        contentLink.version,
        contentLink.locale
    ].filter(x => x).join('::');
}
//# sourceMappingURL=utils.js.map