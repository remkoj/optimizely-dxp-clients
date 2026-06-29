import 'server-only'
import { draftMode } from 'next/headers.js';
import { 
  createClient as createBaseClient,
  AuthMode,
  type IOptiGraphClient,
  type OptimizelyGraphConfig,
  type IOptiGraphClientFlags,
} from '@remkoj/optimizely-graph-client';
import type { ClientFactory } from './types.js';

/**
 * Default implementation of the `ClientFactory` interface
 * 
 * @returns The newly created GraphQL Client
 */
export const createClient: ClientFactory = (token, mode) => {
  const client = createAuthorizedClient(token || undefined);
  if (mode === 'request') {
    const { isEnabled } = draftMode();
    if (isEnabled && client.currentAuthMode === AuthMode.Public) {
      client.updateAuthentication(AuthMode.HMAC)
      client.enablePreview()
      console.info('🔐 [ContentGraph Client] Switching to common drafts')
    } else {
      console.warn(`⚠️ [ContentGraph Client] DraftMode ignored for authorized requests, current mode ${ client.currentAuthMode }`)
    }
  }
  return client;
}

/**
 * Create a new client instance, with the needed configuration to access restricted content. This
 * wraps the `createClient` function from `@remkoj/optimizely-graph-client` and applies some 
 * configuration defaults.
 * 
 * @returns The newly created GraphQL Client
 */
export function createAuthorizedClient(token?: string, config?: OptimizelyGraphConfig, flags?: Partial<IOptiGraphClientFlags>): IOptiGraphClient {
  const client = createBaseClient(config, undefined, { nextJsFetchDirectives: true, ...flags })
  console.info('⚪ [ContentGraph Client] Created new Optimizely Graph client')

  // Apply token if needed
  if (typeof (token) == 'string' && token.length > 0) {
    if (token == client.siteInfo.publishToken) {
      console.warn(`🔐 [ContentGraph Client] Allowed authenticated access by publish token, switching to HMAC`)
      client.updateAuthentication(AuthMode.HMAC)
    } else {
      client.updateAuthentication(token)
    }
    console.warn(`🔐 [ContentGraph Client] Updated authentication, current mode: ${client.currentAuthMode}`)
    console.debug('⚪ [ContentGraph Client] Setting disable cache feature flags')
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
 * @deprecated  use createAuthorizedClient
 * @returns The newly created GraphQL Client
 */
export const getServerClient = createClient

export default createClient
