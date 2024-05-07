import type { ChannelDefinition } from "@remkoj/optimizely-graph-client"
import { localeToGraphLocale as coreLocaleToGraphLocale } from "@remkoj/optimizely-graph-client/utils"

// Extract the path as string array from a given URL
export function urlToPath(baseUrl: URL, language?: string) : string[] {
    let slugs : string[] = baseUrl.pathname.split('/').filter(s => s)
    if (language && slugs[0] == language)
        return slugs.slice(1)
    return slugs
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
export function localeToGraphLocale(locale: string, channel?: ChannelDefinition) : string
{
    return channel?.localeToGraphLocale(locale) ?? coreLocaleToGraphLocale(locale)
}

export function slugToLocale<T extends string | undefined | null>(channel: ChannelDefinition, slug: string, defaultValue: T) : string | T
{
    const route = channel.locales.filter(x => x.slug == slug)[0]
    return route?.code || defaultValue
}

export function slugToGraphLocale<T extends string | undefined | null>(channel: ChannelDefinition, slug: string, defaultValue: T) : string | T
{
    const route = channel.locales.filter(x => x.slug == slug)[0]
    return route?.graphLocale || defaultValue?.replaceAll("-","_") as T
}