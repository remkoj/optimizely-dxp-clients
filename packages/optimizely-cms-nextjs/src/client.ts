import 'server-only'
import { createClient as createBaseClient, AuthMode, type IOptiGraphClient, type OptimizelyGraphConfig } from '@remkoj/optimizely-graph-client'

/**
 * Create a new client instance. This is a direct wrapper for the `createClient` function
 * exported from `@remkoj/optimizely-graph-client`.
 * 
 * @returns The newly created GraphQL Client
 */
export function createClient(): IOptiGraphClient {
  return createAuthorizedClient()
}

/**
 * Create a new client instance, with the needed configuration to access restricted content. This
 * wraps the `createClient` function from `@remkoj/optimizely-graph-client` and applies some 
 * configuration defaults.
 * 
 * @returns The newly created GraphQL Client
 */
export function createAuthorizedClient(token?: string, config?: OptimizelyGraphConfig): IOptiGraphClient {
  const client = createBaseClient(config)
  if (client.debug)
    console.log('⚪ [ContentGraph Client] Created new Optimizely Graph client')

  // Apply token if needed
  if (typeof (token) == 'string' && token.length > 0) {
    if (token == client.siteInfo.publishToken) {
      console.warn(`🔐 [ContentGraph Client] Allowed authenticated access by publish token, switching to HMAC`)
      client.updateAuthentication(AuthMode.HMAC)
    } else {
      client.updateAuthentication(token)
    }

    if (client.debug) {
      console.warn(`🔐 [ContentGraph Client] Updated authentication, current mode: ${client.currentAuthMode}`)
      console.log('⚪ [ContentGraph Client] Setting disable cache feature flags')
    }
    client.updateFlags({ cache: false, cache_uniq: false, queryCache: false }, false)
  }
  return client
}

/**
 * Create a new client instance, with the needed configuration to access restricted content. This
 * wraps the `createClient` function from `@remkoj/optimizely-graph-client` and applies some 
 * configuration defaults.
 * 
 * @deprecated use createAuthorizedClient
 * @returns The newly created GraphQL Client
 */
export const getAuthorizedServerClient = createAuthorizedClient

/**
 * Create a new client instance. This is a direct wrapper for the `createClient` function
 * exported from `@remkoj/optimizely-graph-client`.
 * 
 * @deprecated  use createClient
 * @returns The newly created GraphQL Client
 */
export const getServerClient = createClient

export default createClient