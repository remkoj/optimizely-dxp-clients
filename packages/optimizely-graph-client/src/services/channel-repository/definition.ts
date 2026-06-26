import type { ReadonlyChannelDefinitionData, ChannelDefinitionData, ChannelContent, ChannelDomain, ChannelLocale } from './types.js'

/**
 * Immutable runtime wrapper around channel configuration data.
 *
 * `ChannelDefinition` exposes domain and locale helper methods used by
 * application code to resolve URLs, locales, and Content Graph locale values.
 */
export class ChannelDefinition implements Readonly<ChannelDefinitionData> {
  public readonly id: string
  public readonly name: string
  public readonly domains: ChannelDomain[]
  public readonly locales: ChannelLocale[]
  public readonly content: ChannelContent
  protected readonly dxp_url: string

  /**
   * Determine if the current runtime environment is development.
   *
   * @returns `true` when `NODE_ENV` equals `development`, otherwise `false`
   */
  public get isDev(): boolean {
    try {
      return process.env.NODE_ENV == 'development'
    } catch {
      return false
    }
  }

  /**
   * Resolve the default channel locale code.
   *
   * The first locale marked as default is used, otherwise the first configured
   * locale. If no locales exist, it falls back to `en`.
   *
   * @returns The default locale code
   */
  public get defaultLocale(): string {
    return (this.locales.filter(x => x.isDefault)[0] || this.locales[0])?.code ?? "en"
  }

  /**
   * Resolve the default channel domain name.
   *
   * @returns The primary domain name, or `localhost:3000` when unavailable
   */
  public get defaultDomain(): string {
    const pd = this.getPrimaryChannelDomain()
    return pd?.name ?? "localhost:3000"
  }

  /**
   * Create a new channel definition from persisted channel data.
   *
   * @param initialData The channel data payload
   * @param dxp_url The CMS base URL for this channel
   */
  public constructor(initialData: ChannelDefinitionData, dxp_url: string) {
    this.id = initialData.id
    this.name = initialData.name
    this.domains = initialData.domains
    this.locales = initialData.locales
    this.content = initialData.content
    this.dxp_url = dxp_url
  }

  /**
   * Get the primary domain for this channel. The primary domain is the domain
   * marked as `primary` or the first one in the list of domains for this channel
   * 
   * @param     fallbackValue     The URL to return if no domains have been defined
   * @returns   A URL object for the primary domain
   */
  public getPrimaryDomain(fallbackValue: URL = new URL('http://localhost:3000')): URL {
    const pd = this.getPrimaryChannelDomain()
    return pd ? this.channelDomainToUrl(pd) : fallbackValue;
  }

  /**
   * Get the edit domain for this channel.
   *
   * @returns The configured edit domain URL, or the CMS URL when no explicit
   *          edit domain is configured
   */
  public getEditDomain(): URL {
    const edit = this.domains.filter(x => x.isEdit)[0]
    return edit ? this.channelDomainToUrl(edit) : new URL(this.dxp_url)
  }

  /**
   * Retrieve the configured CMS URL for this channel.
   *
   * @returns The CMS URL
   */
  public getCmsUrl(): string {
    return this.dxp_url
  }

  protected getPrimaryChannelDomain() {
    return this.domains.find(x => x.isPrimary) || // First get the configured primary
        //this.domains.find(x => x.name.startsWith('localhost') || x.name.includes('.local')) || // Then get a localhost or .local
        this.domains[0] //Finally try to get the first one
  }

  /**
   * Get the domain URL that should be used for a specific locale.
   *
   * @param locale The locale code to resolve a domain for
   * @returns The locale-specific domain URL, the primary domain URL, or a
   *          localhost fallback URL
   */
  public getDomainForLocale(locale: string): URL {
    const selected = this.domains.filter(x => x.forLocale === locale)[0] || this.getPrimaryChannelDomain()
    if (selected)
      return this.channelDomainToUrl(selected)
    return new URL('http://localhost:3000')
  }

  protected channelDomainToUrl(d: ChannelDomain) {
    const isSecure = d.isSecure === undefined ? this.isDev : d.isSecure
    return new URL(`http${isSecure ? 's' : ''}://${d.name}`)
  }
  /**
   * Retieve the default locale specification, defined as the locale marked
   * as "primary" else the first locale of the channel. When the channel
   * has no locales it returns undefined.
   * 
   * @returns     The default locale or undefined if the channel has no locales
   */
  public getDefaultLocale(): ChannelLocale | undefined {
    return this.locales.filter(locale => locale.isDefault)[0] || this.locales[0]
  }

  /**
   * Ensure that the locale is part of the current channel configuration, by
   * taking an ISO Language Code and validating it's part of the channel.
   * When the language is not part of the channel, this method will respond with
   * the default ISO Language Code for the channel.
   * 
   * @param       code    The ISO Language Code to validate
   * @returns     An ISO Language code that exists on this channel
   */
  public resolveLocale(code?: string): string {
    return code ? this.locales.filter(locale => locale.code == code)[0]?.code ?? this.defaultLocale : this.defaultLocale
  }

  /**
   * Ensure that the locale is part of the current channel configuration, by
   * taking an ISO Language Code and validating it's part of the channel. Then
   * take the slug for that locale.
   * 
   * When the language is not part of the channel, this method will fall back
   * 
   * @param       code    The ISO Language Code to validate
   * @returns     The resolved slug 
   */
  public resolveSlug(code?: string): string {
    return (this.locales.filter(locale => locale.code == code)[0] ?? this.getDefaultLocale())?.slug ?? "en"
  }

  /**
   * Retrieve a list of all locale slugs configured for this channel
   * 
   * @returns     The list of slugs
   */
  public getSlugs(): string[] {
    return this.locales.map(locale => locale.slug)
  }

  /**
   * Resolve the provided slug to an actual ISO locale
   * 
   * @param       slug        The slug as read from the URL
   * @returns     The ISO locale, undefined if the slug isn't configured
   */
  public slugToLocale(slug: string): string | undefined {
    return this.locales.filter(locale => locale.slug == slug)[0]?.code
  }

  /**
   * Resolve the provided slug to a locale as understood by Optimizely 
   * Content Graph
   * 
   * @param       slug        The slug as read from the URL
   * @returns     The locale for Content Graph, undefined if the slug 
   *              isn't configured
   */
  public slugToGraphLocale(slug: string): string | undefined {
    return this.locales.filter(locale => locale.slug == slug)[0]?.graphLocale
  }

  /**
   * Resolve the provided ISO locale code to an URL slug
   * 
   * @param       code        The locale ISO code
   * @returns     The slug to be used in URLs, undefined if the locale isn't
   *              configured
   */
  public localeToSlug(code: string): string | undefined {
    return this.locales.filter(locale => locale.code == code)[0]?.slug
  }

  /**
   * Resolve the provided locale code to a locale as understood by Optimizely
   * Content Graph
   * 
   * @param       code        The locale ISO code
   * @returns     The locale for Content Graph, undefined if the locale isn't
   *              configured
   */
  public localeToGraphLocale(code: string): string | undefined {
    return this.locales.filter(locale => locale.code == code)[0]?.graphLocale
  }

  /**
   * Extract the data needed to recreate this instance
   * 
   * @returns     An array, with as first element the data and as second element the CMS Domain
   */
  public asDataObject(): Readonly<[ReadonlyChannelDefinitionData, string]> {
    return [{
      id: this.id,
      name: this.name,
      domains: this.domains,
      locales: this.locales,
      content: this.content
    }, this.dxp_url]
  }
}

/**
 * Test if the input varaible is an object of type ChannelDefinition
 * 
 * @param     toTest    The value to test
 * @returns   `true` if the value is a ChannelDefinition, `false` otherwise
 */
export function isChannelDefinition(toTest: unknown): toTest is ChannelDefinition {
  if (typeof toTest !== 'object' || toTest === null)
    return false;
  return typeof (toTest as ChannelDefinition).id === 'string' && typeof (toTest as ChannelDefinition).getPrimaryDomain === 'function';
}

/**
 * Apply a gate on the input variable. It will returned by this function if it is a
 * `ChannelDefinition`. The function will return `undefined` otherwise.
 * 
 * @param     toTest    The value to gate
 * @returns   Either `toTest` or `undefined`, depending on the type of `toTest`
 */
export function ifChannelDefinition(toTest: unknown): ChannelDefinition | undefined {
  return isChannelDefinition(toTest) ? toTest : undefined
}

export default ChannelDefinition
