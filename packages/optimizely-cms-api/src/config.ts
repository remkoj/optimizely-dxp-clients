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

  // Determine the API Base path, if set by the config
  let apiBase: URL | undefined;
  if (apiBaseUrl) {
    try {
      apiBase = new URL(apiBaseUrl)
    } catch (e) {
      throw new Error("Invalid Optimizely CMS API Base URL Provided", { cause: e })
    }
  }

  if (debug)
    console.log(`[Optimizely CMS API] Connecting to ${base || 'CMS API HOST'} as ${clientId ?? 'Anonymous'}`)

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
