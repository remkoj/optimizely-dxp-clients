import { readValue, readValueAsBoolean, readValueAsInt } from "./utils/env"
import EnvVars from "./env-vars"

/**
 * Load Optimizely One configuration from environment variables.
 *
 * Reads environment variables using the `EnvVars` map and returns a typed
 * configuration object containing all Optimizely One service parameters.
 *
 * This function is called automatically by `getEnabledProducts()` if a custom
 * config is not provided.
 *
 * **Configuration properties:**
 *
 * - `RuntimeEnv`: Node runtime environment (defaults to `'production'`)
 * - `OdpApiKey`: API key for Optimizely Data Platform
 * - `OdpService`: ODP service endpoint URL (defaults to `https://api.zaius.com/`)
 * - `OdpAudienceBatchSize`: Batch size for ODP audience queries (defaults to `25`)
 * - `HelperEnabled`: Enable/disable Optimizely One integration (defaults to `false`)
 * - `ContentRecsClient`: Content Recommendations client identifier
 * - `ContentRecsDelivery`: Content Recommendations delivery method (defaults to `0`)
 * - `ContentRecsDeliveryKey`: API key for Content Recommendations
 * - `ContentRecsHost`: Content Recommendations host (defaults to `"idio.co"`)
 * - `FrontendCookie`: Cookie name for visitor ID (defaults to `"visitorId"`)
 * - `WebExperimentationProject`: Project ID for Web Experimentation
 * - `OptimizelyDebug`: Enable debug logging for Optimizely (defaults to `false`)
 *
 * @returns Configuration object with type `OptiOneConfig`.
 *
 * @example
 * ```tsx
 * import { readConfigFromEnv } from '@remkoj/optimizely-one-nextjs'
 *
 * const config = readConfigFromEnv()
 * console.log('ODP API Key:', config.OdpApiKey)
 * console.log('Runtime Environment:', config.RuntimeEnv)
 * ```
 *
 * @example
 * ```tsx
 * // Use for conditional initialization
 * import { readConfigFromEnv, checkProductStatus } from '@remkoj/optimizely-one-nextjs'
 *
 * const config = readConfigFromEnv()
 * const productStatus = checkProductStatus(config)
 * if (productStatus.dataPlatform) {
 *   initializeODP(config.OdpApiKey, config.OdpService)
 * }
 * ```
 */
export function readConfigFromEnv() {
  return {
    RuntimeEnv: readValue('NODE_ENV', 'production'),
    OdpApiKey: readValue(EnvVars.OdpApiKey),
    OdpService: readValue(EnvVars.OdpService, "https://api.zaius.com/"),
    OdpAudienceBatchSize: readValueAsInt(EnvVars.OdpAudienceBatchSize, 25),
    HelperEnabled: readValueAsBoolean(EnvVars.HelperEnabled, false),
    ContentRecsClient: readValue(EnvVars.ContentRecsClient),
    ContentRecsDelivery: readValueAsInt(EnvVars.ContentRecsDelivery, 0),
    ContentRecsDeliveryKey: readValue(EnvVars.ContentRecsDeliveryKey),
    ContentRecsHost: readValue(EnvVars.ContentRecsHost, "idio.co"),
    FrontendCookie: readValue(EnvVars.FrontendCookie, "visitorId"),
    WebExperimentationProject: readValue(EnvVars.WebExperimentationProject),
    OptimizelyDebug: readValueAsBoolean(EnvVars.OptimizelyDebug, false),
    FeatureExperimentationProject: readValue(EnvVars.FeatureExperimentationProject),
    FeatureExperimentationSdkKey: readValue(EnvVars.FeatureExperimentationSdkKey),
    FeatureExperimentationToken: readValue(EnvVars.FeatureExperimentationPat)
  }
}

/**
 * Evaluate product enablement status based on configuration.
 *
 * Checks the provided configuration object to determine which Optimizely One
 * products are properly configured and available for use. Each product has
 * specific configuration requirements:
 *
 * **Activation criteria:**
 *
 * - `dataPlatform`: `OdpApiKey` must be a string with >8 characters
 * - `contentRecsClient`: Both `ContentRecsClient` AND `ContentRecsDelivery` must be set
 * - `contentRecsApi`: Both `ContentRecsClient` AND `ContentRecsDeliveryKey` must be set
 * - `webExperimentation`: `WebExperimentationProject` must be a string with >5 characters
 *
 * @param config - Optional partial configuration object.
 *                 If not provided, configuration is read from environment variables.
 * @returns An object with boolean status for each product:
 *          - `dataPlatform: boolean`
 *          - `contentRecsClient: boolean`
 *          - `contentRecsApi: boolean`
 *          - `webExperimentation: boolean`
 *
 * @example
 * ```tsx
 * import { checkProductStatus, readConfigFromEnv } from '@remkoj/optimizely-one-nextjs'
 *
 * const config = readConfigFromEnv()
 * const status = checkProductStatus(config)
 *
 * Object.entries(status).forEach(([product, isEnabled]) => {
 *   console.log(`${product}: ${isEnabled ? 'enabled' : 'disabled'}`)
 * })
 * ```
 *
 * @example
 * ```tsx
 * import { checkProductStatus } from '@remkoj/optimizely-one-nextjs'
 *
 * // Check with custom configuration
 * const customConfig = {
 *   OdpApiKey: 'my-api-key-12345678',
 *   WebExperimentationProject: 'campaign-123456',
 *   ContentRecsClient: 'my-client',
 *   ContentRecsDeliveryKey: 'content-key'
 * }
 * const productStatus = checkProductStatus(customConfig)
 * ```
 */
export function checkProductStatus(config?: Partial<OptiOneConfig>): {
  dataPlatform: boolean,
  contentRecsClient: boolean,
  contentRecsApi: boolean,
  webExperimentation: boolean,
  featureExperimentation: boolean
} {
  const appConfig: Partial<OptiOneConfig> = config ?? readConfigFromEnv()
  return {
    dataPlatform: typeof (appConfig.OdpApiKey) == 'string' && appConfig.OdpApiKey.length > 8,
    contentRecsClient: appConfig.ContentRecsClient && appConfig.ContentRecsDelivery ? true : false,
    contentRecsApi: appConfig.ContentRecsClient && appConfig.ContentRecsDeliveryKey ? true : false,
    webExperimentation: typeof (appConfig.WebExperimentationProject) == 'string' && appConfig.WebExperimentationProject.length > 5,
    featureExperimentation: typeof (appConfig.FeatureExperimentationSdkKey) == 'string' && appConfig.FeatureExperimentationSdkKey.length > 5
  }
}

/**
 * Complete Optimizely One configuration object.
 *
 * This is the return type of `readConfigFromEnv()` and represents all
 * configuration parameters available for Optimizely One services.
 *
 * Contains settings for:
 * - ODP (Data Platform)
 * - Content Recommendations
 * - Web Experimentation
 * - General platform options
 *
 * @example
 * ```tsx
 * import type { OptiOneConfig } from '@remkoj/optimizely-one-nextjs'
 * import { readConfigFromEnv } from '@remkoj/optimizely-one-nextjs'
 *
 * const config: OptiOneConfig = readConfigFromEnv()
 * ```
 */
export type OptiOneConfig = ReturnType<typeof readConfigFromEnv>

export default readConfigFromEnv
