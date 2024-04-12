import { localeToGraphLocale as coreLocaleToGraphLocale } from "@remkoj/optimizely-graph-client/utils";
// Extract the path as string array from a given URL
export function urlToPath(baseUrl, language) {
    let slugs = baseUrl.pathname.split('/').filter(s => s);
    if (language && slugs[0] == language)
        slugs.shift();
    return slugs;
}
/**
 * Transform a locale to an Optimizely Graph locale, defaulting to the lookup
 * table in the Channel definition, falling back to the programmatic approach
 * after.
 *
 * @param locale
 * @param channel
 * @returns
 */
export function localeToGraphLocale(locale, channel) {
    return channel?.localeToGraphLocale(locale) ?? coreLocaleToGraphLocale(locale);
}
export function slugToLocale(channel, slug, defaultValue) {
    const route = channel.locales.filter(x => x.slug == slug)[0];
    return route?.code || defaultValue;
}
export function slugToGraphLocale(channel, slug, defaultValue) {
    const route = channel.locales.filter(x => x.slug == slug)[0];
    return route?.graphLocale || defaultValue?.replaceAll("-", "_");
}
//# sourceMappingURL=utils.js.map