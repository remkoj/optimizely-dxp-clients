import type { ReadonlyRequestCookies } from '../types'
import { checkProductStatus, type OptiOneConfig } from "../../config"

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

export function isEnabled(config?: OptiOneConfig) {
  return checkProductStatus(config).dataPlatform
}

export default {
  getVisitorID,
  parseApiKey
}