import type { ChannelDefinition } from "@remkoj/optimizely-graph-client";
export declare function urlToPath(baseUrl: URL, language?: string): string[];
/**
 * Transform a locale to an Optimizely Graph locale, defaulting to the lookup
 * table in the Channel definition, falling back to the programmatic approach
 * after.
 *
 * @param locale
 * @param channel
 * @returns
 */
export declare function localeToGraphLocale(locale: string, channel?: ChannelDefinition): string;
export declare function slugToLocale<T extends string | undefined | null>(channel: ChannelDefinition, slug: string, defaultValue: T): string | T;
export declare function slugToGraphLocale<T extends string | undefined | null>(channel: ChannelDefinition, slug: string, defaultValue: T): string | T;
