const DEFAULT_API_HOST = 'https://api.cms.optimizely.com/'
const API_VERSION_PATH = 'v1'

/**
 * The API Base URL used when neither a CMS URL nor an explicit override has
 * been configured.
 */
export const DEFAULT_API_BASEURL = new URL(API_VERSION_PATH, DEFAULT_API_HOST)

/**
 * Configuration options for creating and authenticating a CMS Integration API client.
 */
export type CmsIntegrationApiOptions = {
  /**
   * The domain where the CMS instance is running
   */
  base?: URL
  /**
   * The OAuth Client ID for the client credentials login
   */
  clientId?: string
  /**
   * The OAuth client secret for the client credentials login
   */
  clientSecret?: string
  /**
   * The username to impersonate, using the special "actAs"
   * field supported by Optimizely CMS
   */
  actAs?: string
  /**
   * Flag to enable debugging output
   */
  debug?: boolean
  /**
   * The BaseURL where the services are running
   */
  apiBaseUrl?: URL
}
type ClientCredentials = 'clientId' | 'clientSecret'

/**
 * Reads CMS Integration API configuration from environment variables.
 *
 * Client credentials are optional in this variant, which allows callers to
 * bootstrap configuration and decide credential handling separately.
 *
 * @returns A partially populated configuration object.
 */
export function readPartialEnvConfig(): CmsIntegrationApiOptions {
  const apiBaseUrl = getOptional('OPTIMIZELY_CMS_API_BASEURL')
  const cmsUrl = getOptional('OPTIMIZELY_CMS_URL')
  const clientId = getOptional('OPTIMIZELY_CMS_CLIENT_ID')
  const clientSecret = getOptional('OPTIMIZELY_CMS_CLIENT_SECRET')
  const actAs = getOptional('OPTIMIZELY_CMS_USER_ID')
  const debug = getOptional('OPTIMIZELY_DEBUG', "0") == "1"

  // Determine the CMS URL, if set by the config
  let base: URL | undefined
  if (cmsUrl) {
    try {
      base = new URL(cmsUrl.includes("://") ? cmsUrl : 'https://' + cmsUrl)
    } catch (e) {
      throw new Error("Invalid Optimizely CMS URL provided", { cause: e })
    }
  }

  // Determine the API Base path; an explicit override wins, otherwise it is
  // derived from the CMS URL so that non-production tenants (e.g. cmstest)
  // don't silently end up talking to the production gateway.
  let apiBase: URL | undefined;
  try {
    apiBase = resolveApiBaseUrl({ base, apiBaseUrl: apiBaseUrl ? new URL(apiBaseUrl) : undefined })
  } catch (e) {
    throw new Error("Invalid Optimizely CMS API Base URL Provided", { cause: e })
  }

  if (debug)
    console.log(`[Optimizely CMS API] Connecting to ${apiBase || DEFAULT_API_BASEURL} (CMS: ${base || 'not set'}) as ${clientId ?? 'Anonymous'}`)

  return {
    base,
    clientId,
    clientSecret,
    actAs,
    debug,
    apiBaseUrl: apiBase
  }
}

/**
 * Reads and validates CMS Integration API configuration from environment variables.
 *
 * This function requires both client credentials to be present and throws when
 * either value is missing.
 *
 * @returns Configuration object with required `clientId` and `clientSecret`.
 * @throws {Error} When a required client credential is missing.
 */
export function readEnvConfig(): Omit<CmsIntegrationApiOptions, ClientCredentials> & Pick<Required<CmsIntegrationApiOptions>, ClientCredentials> {
  const partialConfig = readPartialEnvConfig()

  if (!partialConfig.clientId)
    throw new Error("The Client ID (OPTIMIZELY_CMS_CLIENT_ID) is a required environment variable")

  if (!partialConfig.clientSecret)
    throw new Error("The Client Secret (OPTIMIZELY_CMS_CLIENT_SECRET) is a required environment variable")

  return partialConfig as Omit<CmsIntegrationApiOptions, ClientCredentials> & Pick<Required<CmsIntegrationApiOptions>, ClientCredentials>
}

/**
 * Derives the Optimizely managed API gateway from a CMS frontend URL.
 *
 * The gateway lives on a sibling host that carries the environment suffix but
 * not the tenant, so `app-xyz.cmstest.optimizely.com` maps to
 * `api.cmstest.optimizely.com` and `app-xyz.cms.optimizely.com` maps to
 * `api.cms.optimizely.com`.
 *
 * @param cmsUrl - The CMS frontend URL.
 * @returns The API gateway origin, or `undefined` when the URL is not a
 * recognised Optimizely SaaS CMS host (i.e. a self-hosted instance).
 */
function extractApiGateway(cmsUrl: URL): URL | undefined {
  const saasMatch = cmsUrl.hostname.match(/^[^.]+\.cms([^.]*)\.optimizely\.com$/)
  if (!saasMatch)
    return undefined
  return new URL(`https://api.cms${saasMatch[1] ?? ''}.optimizely.com/`)
}

/**
 * Resolves the API base URL for a configuration.
 *
 * An explicit `apiBaseUrl` always wins. Otherwise the base is derived from the
 * CMS URL, so a configuration built from CLI arguments or passed to
 * `createClient()` reaches the same gateway as the equivalent environment
 * variables would.
 *
 * @param config - The configuration to resolve.
 * @returns The API base URL, or `undefined` when neither value is available.
 */
export function resolveApiBaseUrl(config: Pick<CmsIntegrationApiOptions, 'base' | 'apiBaseUrl'>): URL | undefined {
  if (config.apiBaseUrl)
    return config.apiBaseUrl
  if (!config.base)
    return undefined
  const gateway = extractApiGateway(config.base)
  return gateway
    ? new URL(API_VERSION_PATH, gateway)
    : new URL(`_cms/${API_VERSION_PATH}`, config.base)
}

/**
 * Determines whether a URL points at an Optimizely managed API gateway.
 *
 * @param url - The API base URL to inspect.
 * @returns `true` for `api.cms<env>.optimizely.com` hosts.
 */
function isManagedApiGateway(url: URL): boolean {
  return /^api\.cms[^.]*\.optimizely\.com$/.test(url.hostname)
}

/**
 * Resolves the base URL that serves the OAuth token endpoint.
 *
 * A managed gateway serves it from the host root, a self-hosted instance from
 * the `/_cms/v1/` path. The returned URL always carries a trailing slash, so
 * resolving `oauth/token` against it appends rather than replaces.
 *
 * @param apiBaseUrl - The resolved API base URL.
 * @returns The base URL for the authentication endpoint.
 */
export function getAuthBaseUrl(apiBaseUrl: URL | string): URL {
  const apiUrl = typeof apiBaseUrl === 'string' ? new URL(apiBaseUrl) : apiBaseUrl
  return isManagedApiGateway(apiUrl)
    ? new URL('/', apiUrl)
    : new URL(`/_cms/${API_VERSION_PATH}/`, apiUrl)
}

function getOptional<DT extends string | undefined>(variable: string, defaultValue?: DT): DT extends string ? string : string | undefined {
  const envValue = process.env[variable]
  if (!envValue || envValue == "")
    return defaultValue as DT extends string ? string : undefined
  return envValue
}
/*function getMandatory(variable: string): string {
  const envValue = process.env[variable]
  if (!envValue)
    throw new Error(`The environment variable ${variable} is missing or empty`)
  return envValue
}
function getSelection<T>(envVarName: string, allowedValues: T[], defaultValue: T): T {
  const rawValue = getOptional(envVarName, defaultValue as string)
  if (!rawValue)
    return defaultValue
  if (allowedValues.some(av => av == rawValue))
    return rawValue as T
  return defaultValue
}*/
