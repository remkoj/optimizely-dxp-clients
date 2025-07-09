import type { ContentLink } from '../types.js'

/**
 * Domain definition for a Channel Domain
 */
export type ChannelDomain = {
  /**
   * The domain name, without protocol
   */
  name: string
  /**
   * Marker to set if this is the primary domain, e.g. the domain 
   * to use if there's no other matching.
   */
  isPrimary: boolean
  /**
   * Marker to set if this is the edit domain, e.g. the domain 
   * to use if there's no other matching.
   */
  isEdit: boolean
  /**
   * Marker to set if this domain uses a secure protocol
   */
  isSecure?: boolean
  /**
   * The locale for this domain. It's to be used for all unmapped
   * locales when this is `undefined` or `"ALL"`.
   */
  forLocale?: "ALL" | string
}
export type ChannelLocale = {
  code: string
  slug: string
  graphLocale: string
  isDefault: boolean
}
export type ChannelContent = {
  startPage?: ContentLink
}
export type ChannelDefinitionData = {
  id: string
  name: string
  domains: ChannelDomain[]
  locales: ChannelLocale[]
  content: ChannelContent
}
export type ReadonlyChannelDefinitionData = {
  readonly id: string
  readonly name: string
  readonly domains: Array<Readonly<ChannelDomain>>
  readonly locales: Array<Readonly<ChannelLocale>>
  readonly content: Readonly<ChannelContent>
}