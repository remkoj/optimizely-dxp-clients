import 'server-only'
import { isOptiGraphClient, isOptiGraphConfig, createClient as createBaseClient, AuthMode, type IOptiGraphClient, type OptimizelyGraphConfig } from '@remkoj/optimizely-graph-client'
import { isNonEmptyString } from '@remkoj/optimizely-cms-react/utils'
import { draftMode } from 'next/headers.js';
import { logger } from './logger.js'

/** Minimum length for a token that does not start with `use-`. */
const MIN_TOKEN_LENGTH = 16;

/** Values of the Graph authentication mode enum, used to identify mode overrides. */
const AuthModeValues = Object.getOwnPropertyNames(AuthMode).reduce<string[]>((a: string[], b: string) => {
  // @ts-expect-error AuthMode's reverse enum mapping is intentionally read here.
  a.push(AuthMode[b]);
  return a
}, [] as string[])

/**
 * Client creation context: `request` may read Draft Mode; `metadata` skips it.
 */
export type RequestScope = 'request' | 'metadata';

/**
 * Graph client configuration with Next.js-specific authentication controls.
 */
export type NextJsOptimizelyGraphConfig = OptimizelyGraphConfig & {
  /**
   * Client creation context. Defaults to `request`.
   */
  scope?: RequestScope

  /**
   * Disable the development/debug shortcuts that accept the publish token or
   * an authentication mode as an override. Ordinary tokens are still applied.
   */
  disableTokenBypass?: boolean

  /**
   * Skip reading Next.js Draft Mode, even in `request` scope.
   */
  disableDraftMode?: boolean
}

/**
 * Extract a Graph configuration when the argument is an object.
 *
 * @param configOrScope - Configuration object or scope shorthand.
 * @returns The configuration, or undefined for a scope shorthand.
 */
function extractConfig(configOrScope?: RequestScope | NextJsOptimizelyGraphConfig): NextJsOptimizelyGraphConfig | undefined {
  return configOrScope && typeof(configOrScope) === 'object' ? configOrScope : undefined;
}

/**
 * Resolve the client scope from a shorthand or configuration object.
 *
 * @param configOrScope - Configuration object or scope shorthand.
 * @returns The supplied scope, or `request` when none is specified.
 */
function extractScope(configOrScope: RequestScope | NextJsOptimizelyGraphConfig): RequestScope {
  if (configOrScope === 'request' || configOrScope === 'metadata')
    return configOrScope;
  else if (configOrScope && typeof(configOrScope) === 'object')
    return configOrScope.scope || 'request';
  return 'request';
}

/**
 * Check whether a token is eligible to be passed to the Graph client.
 * This is a preliminary length/prefix check, not credential validation.
 *
 * @param token - The token or authentication mode to check.
 * @returns Whether the token is nonempty and long enough or starts with `use-`.
 */
function prevalidateToken(token?: string): token is string {
  return isNonEmptyString(token) && (token.length >= MIN_TOKEN_LENGTH || token.startsWith('use-'));
}

/**
 * Create an Optimizely Graph client with Next.js fetch directives and caching
 * enabled. Applied tokens update authentication and disable Graph caching.
 * In development or debug mode, a matching publish token or the HMAC/Basic
 * mode values may also select authenticated access unless bypass is disabled.
 *
 * In `request` scope, enabled Draft Mode switches a public client to HMAC and
 * enables preview. An already authorized client is left unchanged. This reads
 * Next.js request state unless `disableDraftMode` is set; use `metadata` scope
 * outside a request.
 *
 * @param token - Optional Graph token or development/debug authentication override.
 *   Values shorter than 16 characters are ignored unless they start with `use-`.
 * @param configOrScope - Graph configuration with Next.js options, or a scope
 *   shorthand. Defaults to `request`.
 * @returns A promise for the configured Graph client.
 * @throws If Graph configuration or authentication is invalid, or request
 *   state cannot be accessed when Draft Mode is checked.
 */
export async function createNextJsClient(token?: string, configOrScope: RequestScope | NextJsOptimizelyGraphConfig = 'request'): Promise<IOptiGraphClient> {
  // Prepare the context
  const hasToken = prevalidateToken(token);
  const config = extractConfig(configOrScope);
  const scope = extractScope(configOrScope);
  const allowDraftMode = config?.disableDraftMode !== true;

  // Create the client with Next.js fetch directives and caching enabled.
  const client = createBaseClient(config, undefined, { nextJsFetchDirectives: true, cache: true, queryCache: true });
  if (client.debug)
    console.log('⚪ [ContentGraph Client] Created new Optimizely Graph client')

  // Enhance the context with the conditional for overrides only in
  // debug and development mode
  const allowOverrides = client.isDebugOrDevelopment() && config?.disableTokenBypass !== true;

  /**
   * Update authentication and disable the Graph cache flags.
   *
   * @param client - The client to update.
   * @param mode - Authentication mode or token.
   * @returns The updated client.
   */
  function updateAuthentication(client: IOptiGraphClient, mode?: AuthMode | string)
  {
    client.updateAuthentication(mode);
    client.updateFlags({ cache: false, cache_uniq: false, queryCache: false }, false);
    if (client.isDebugOrDevelopment()) {
      console.warn(`🔐 [ContentGraph Client] Updated authentication, current mode: ${client.currentAuthMode}`);
      console.log('⚪ [ContentGraph Client] Setting disable cache feature flags');
    }
    return client;
  }

  // Apply token if needed
  if (hasToken) {

    // First allow overriding by using the publishing token
    if (allowOverrides && token == client.siteInfo.publishToken) {
      logger.warn(`🔐 [ContentGraph Client] Allowed authenticated access by publish token, switching to HMAC`)
      updateAuthentication(client, AuthMode.HMAC)

    // Then handle the overriding by using the auth mode in debug or development
    } else if (allowOverrides && AuthModeValues.includes(token)) {
      if (token === AuthMode.HMAC || token === AuthMode.Basic) {
        logger.warn(`🔐 [ContentGraph Client] Allowing authenticated access by using a mode as token in development or debug`)
        updateAuthentication(client, token)
      } else
        logger.warn(`🔐 [ContentGraph Client] Blocked authenticated access by using invalid mode as token`)

    // If none of the gates apply and it's not an AuthMode just use the token as-is
    } else if (!AuthModeValues.includes(token)) {
      updateAuthentication(client, token)
    }
  }

  // Draft mode support
  if (allowDraftMode && scope === 'request' && (await draftMode()).isEnabled) {
    if (client.currentAuthMode === AuthMode.Public) {
      client.updateAuthentication(AuthMode.HMAC)
      client.enablePreview()
      logger.warn('🔐 [ContentGraph Client] Switching to common drafts using HMAC authentication')
    } else {
      logger.warn(`⚠️ [ContentGraph Client] DraftMode ignored for authorized requests, current mode ${ client.currentAuthMode }`)
    }
  }

  return client
}

/**
 * Factory that creates a Graph client synchronously or asynchronously.
 *
 * @param token - Optional token or authentication override.
 * @param configOrScope - Optional Graph configuration or client scope.
 * @returns A Graph client, directly or as a promise.
 */
export type NextJsClientFactory =
  ((token?: string, configOrScope?: RequestScope | NextJsOptimizelyGraphConfig) => Promise<IOptiGraphClient>) |
  ((token?: string, configOrScope?: RequestScope | NextJsOptimizelyGraphConfig) => IOptiGraphClient);

/**
 * Type that holds all possible input options for the `resolveClient`
 * function.
 */
export type NextJsClientOption = Parameters<typeof resolveClient>[0];

/**
 * Check whether a value is callable as a client factory.
 *
 * This only checks that the value is a function; it does not validate its
 * arguments or return value.
 *
 * @param toTest - The value to check.
 * @returns Whether the value is a function.
 */
export function isClientFactory(toTest?: unknown): toTest is NextJsClientFactory
{
  return typeof(toTest) === 'function';
}

/**
 * Resolve an existing Graph client without modifying it, unless it is also
 * recognized as a configuration (which takes precedence).
 *
 * @param clientFactory - The client to return.
 * @returns A promise for the supplied client.
 * @throws If the value is not recognized as a Graph client.
 */
export async function resolveClient(
  clientFactory: IOptiGraphClient,
) : Promise<IOptiGraphClient>
/**
 * Create a Next.js Graph client from a configuration object recognized by
 * `isOptiGraphConfig` (an object with a nonempty `single_key`).
 *
 * @param clientFactory - Graph configuration, including optional Next.js settings.
 * @param token - Optional token or authentication override.
 * @returns A promise for the newly created client.
 * @throws If the configuration is not recognized or client creation fails.
 */
export async function resolveClient(
  clientFactory: NextJsOptimizelyGraphConfig,
  token?: string,
) : Promise<IOptiGraphClient>
/**
 * Invoke a client factory with a token and scope.
 *
 * @param clientFactory - Synchronous or asynchronous client factory.
 * @param token - Optional token or authentication override passed to the factory.
 * @param scope - Optional client scope passed to the factory.
 * @returns A promise for the factory-created client.
 * @throws If the factory fails or its result is not recognized as a Graph client.
 */
export async function resolveClient(
  clientFactory: NextJsClientFactory,
  token?: string,
  scope?: RequestScope
) : Promise<IOptiGraphClient>
/**
 * Invoke a client factory with a token and configuration.
 *
 * @param clientFactory - Synchronous or asynchronous client factory.
 * @param token - Optional token or authentication override passed to the factory.
 * @param config - Optional Graph configuration passed to the factory.
 * @returns A promise for the factory-created client.
 * @throws If the factory fails or its result is not recognized as a Graph client.
 */
export async function resolveClient(
  clientFactory: NextJsClientFactory,
  token?: string,
  config?: NextJsOptimizelyGraphConfig
) : Promise<IOptiGraphClient>
/**
 * Resolve a Graph client, configuration, or synchronous or asynchronous factory.
 *
 * Configurations with a nonempty `single_key` are checked first and create a client via `createNextJsClient`;
 * existing clients are returned unchanged; factories receive `token` and
 * `configOrScope`. The third argument is ignored for configurations and clients.
 *
 * @param clientFactory - Graph configuration, client, or client factory.
 * @param token - Optional token for client creation or the factory.
 * @param configOrScope - Optional configuration or scope passed to a factory.
 * @returns A promise for the resolved client.
 * @throws If the input or factory result is not recognized, or creation fails.
 */
export async function resolveClient(
  clientFactory: NextJsOptimizelyGraphConfig | IOptiGraphClient | NextJsClientFactory,
  token?: string,
  configOrScope?: RequestScope | NextJsOptimizelyGraphConfig
) : Promise<IOptiGraphClient>
/**
 * Resolve a client using the first matching configuration, client, or factory.
 *
 * @param clientFactory - Graph configuration, client, or client factory.
 * @param token - Optional token for client creation or the factory.
 * @param configOrScope - Optional configuration or scope passed to a factory.
 * @returns A promise for the resolved client.
 * @throws If the input or factory result is not recognized, or creation fails.
 */
export async function resolveClient(
  clientFactory: NextJsOptimizelyGraphConfig | IOptiGraphClient | NextJsClientFactory,
  token?: string,
  configOrScope?: RequestScope | NextJsOptimizelyGraphConfig
) : Promise<IOptiGraphClient>
{
  if (isOptiGraphConfig(clientFactory))
    return createNextJsClient(token, clientFactory);
  if (isOptiGraphClient(clientFactory))
    return clientFactory;
  if (isClientFactory(clientFactory)) {
    const client = await clientFactory(token, configOrScope);
    if (isOptiGraphClient(client))
      return client;
  }
  throw new Error('The client must be an instance of IOptiGraphClient or a factory function returning the client');
}

export default createNextJsClient;

//#region Deprecated surface
/**
 * Create a client with the default `request` scope.
 *
 * @param token - Optional Graph token or development/debug authentication override.
 * @returns A promise for the configured Graph client.
 * @deprecated Use `createNextJsClient` to configure the scope and client options.
 */
export const createClient = (token?: string) => createNextJsClient(token);

/**
 * Alias for `createClient`, using the default `request` scope.
 *
 * @param token - Optional Graph token or development/debug authentication override.
 * @returns A promise for the configured Graph client.
 * @deprecated Use `createNextJsClient` to configure the scope and client options.
 */
export const createAuthorizedClient = createClient;

/**
 * Alias for `createClient`, using the default `request` scope.
 *
 * @param token - Optional Graph token or development/debug authentication override.
 * @returns A promise for the configured Graph client.
 * @deprecated Use `createNextJsClient` to configure the scope and client options.
 */
export const getAuthorizedServerClient = createClient;

/**
 * Alias for `createClient`, using the default `request` scope.
 *
 * @param token - Optional Graph token or development/debug authentication override.
 * @returns A promise for the configured Graph client.
 * @deprecated Use `createNextJsClient` to configure the scope and client options.
 */
export const getServerClient = createClient;
//#endregion