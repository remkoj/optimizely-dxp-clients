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
export function _contentLinkIsEqualIgnoreVersion(link1, link2) {
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
export function _isContentLinkWithLocale(toTest) {
    if (!isContentLink(toTest))
        return false;
    const locale = toTest.locale;
    return locale == undefined || (typeof (locale) == 'string' && locale.length >= 2 && locale.length <= 5);
}
/**
 * Take the normalizable value
 *
 * @param toNormalize
 * @returns
 */
export function normalizeContentLink(toNormalize) {
    if (!isContentLink(toNormalize))
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
export function contentLinkToString(contentLink) {
    return [
        contentLink.key,
        contentLink.version,
        contentLink.locale
    ].filter(x => x).join('::');
}
//# sourceMappingURL=utils.js.map