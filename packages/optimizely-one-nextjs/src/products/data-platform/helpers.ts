import type { ReadonlyRequestCookies } from '../types'
import getConfig, { checkProductStatus, type OptiOneConfig } from "../../config"
import { getVisitorID as getContentIntelligenceId } from '../content-recs/helpers'

/**
 * The visitor identifiers that ODP uses to link a visitor's data into one profile.
 */
export type VisitorIdentifiers = {
  /** The ODP visitor ID, read from the `vuid` cookie. */
  vuid?: string
  /** The frontend visitor ID, read from the configured frontend cookie. */
  fs_user_id?: string
  /** The Content Intelligence ID, read from the `iv` cookie. */
  content_intelligence_id?: string
}

/**
 * Process the provided API key
 * 
 * @param       configuredKey       The currently configured key
 * @returns     Analyze the provided key and return the public key and private key from it
 */
export function parseApiKey(configuredKey: string): [string, string | null] {
  const [publicKey, privateKey] = configuredKey.split(".", 2);
  return [publicKey, privateKey ? configuredKey : null]
}

/**
 * Parse the request cookies to understand the visitor identifier 
 * from the Optimizely Data Platform.
 * 
 * @param       cookies         The request cookies
 * @returns     The identifier, or undefined if not known
 */
export function getVisitorID(cookies: Awaited<ReadonlyRequestCookies>): string | undefined {
  return cookies.get('vuid')?.value?.split("|")?.shift()?.replaceAll('-', '')
}

/**
 * Read every visitor identifier that must accompany a server-side ODP write.
 *
 * This mirrors what the browser client sends: the `vuid` managed by `zaius.js`,
 * the `fs_user_id` (the configured frontend cookie, `OPTIMIZELY_FRONTEND_COOKIE`)
 * and, when present, the Content Intelligence ID (the `iv` cookie). ODP only
 * merges a server-side submission into the visitor's profile when the
 * identifiers match those the browser has sent.
 *
 * @param       cookies         The request cookies
 * @returns     The identifiers that are present; missing identifiers are omitted
 */
export function getVisitorIdentifiers(cookies: Awaited<ReadonlyRequestCookies>): VisitorIdentifiers {
  const identifiers: VisitorIdentifiers = {}
  const vuid = getVisitorID(cookies)
  const fsUserId = cookies.get(getConfig().FrontendCookie)?.value
  const contentIntelligenceId = getContentIntelligenceId(cookies)
  if (vuid) identifiers.vuid = vuid
  if (fsUserId) identifiers.fs_user_id = fsUserId
  if (contentIntelligenceId) identifiers.content_intelligence_id = contentIntelligenceId
  return identifiers
}

/**
 * Check whether the Data Platform integration has been configured.
 *
 * @param       config          Optional configuration, read from the environment by default
 * @returns     True when the Data Platform integration is enabled
 */
export function isEnabled(config?: OptiOneConfig) {
  return checkProductStatus(config).dataPlatform
}

export default {
  getVisitorID,
  getVisitorIdentifiers,
  parseApiKey
}