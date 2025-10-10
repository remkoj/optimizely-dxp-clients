import 'server-only'
import { createClient as createBaseClient, AuthMode, type IOptiGraphClient, type OptimizelyGraphConfig } from '@remkoj/optimizely-graph-client'
import { isNonEmptyString } from '@remkoj/optimizely-cms-react/utils'

const AuthModeValues = Object.getOwnPropertyNames(AuthMode).reduce<string[]>((a: string[], b: string) => {
  //@ts-ignore
  a.push(AuthMode[b]);
  return a
}, [] as string[])

/**
 * Create a new client instance. This is a direct wrapper for the `createClient` function
 * exported from `@remkoj/optimizely-graph-client`. It creates the instance with the 
 * recommended configuration for published content in a Next.JS frontend.
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
 * It creates the instance with the recommended configuration for published content in a Next.JS
 * frontend. When the token is a non-empty string, the configuration applied is intended to access
 * non-published content in a Next.JS frontend, for example in the preview endpoint of Optimizely CMS.
 * 
 * @returns The newly created GraphQL Client
 */
export function createAuthorizedClient(token?: string, config?: OptimizelyGraphConfig): IOptiGraphClient {
  // Check the token
  const isPotentialValidToken = isNonEmptyString(token)

  // Create the client, but keep the cache disabled if we've got a non-empty string as token
  const client = createBaseClient(config, undefined, {
    nextJsFetchDirectives: true,
    cache: !isPotentialValidToken,
    queryCache: !isPotentialValidToken,
  })
  if (client.debug)
    console.log('⚪ [ContentGraph Client] Created new Optimizely Graph client')

  // Apply token if needed
  if (isPotentialValidToken) {
    if (token == client.siteInfo.publishToken) {
      console.warn(`🔐 [ContentGraph Client] Allowed authenticated access by publish token, switching to HMAC`)
      client.updateAuthentication(AuthMode.HMAC)
    } else if (AuthModeValues.includes(token)) {
      if (client.isDebugOrDevelopment() && (token === AuthMode.HMAC || token === AuthMode.Basic)) {
        console.warn(`🔐 [ContentGraph Client] Allowing authenticated access by using a mode as token in development or debug`)
        client.updateAuthentication(token)
      } else
        console.warn(`🔐 [ContentGraph Client] Blocked authenticated access by using a mode as token`)
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