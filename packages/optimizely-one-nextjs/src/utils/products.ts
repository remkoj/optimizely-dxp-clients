import 'server-only'
import { checkProductStatus, readConfigFromEnv, type OptiOneConfig } from '../config'
import EnvVars from '../env-vars'
import EnvTools from '../utils/env'

/**
 * Enumeration of Optimizely One product names supported by this package.
 *
 * These are the keys of the status object returned by `checkProductStatus`.
 *
 * Includes:
 * - `dataPlatform`: Optimizely Data Platform (ODP) for audience/segment management.
 * - `contentRecsClient`: Content Recommendations client-side integration.
 * - `contentRecsApi`: Content Recommendations API integration.
 * - `webExperimentation`: Optimizely Web Experimentation (A/B testing, personalization).
 *
 * @example
 * ```tsx
 * import { getEnabledProducts } from '@remkoj/optimizely-one-nextjs'
 *
 * const enabled: Array<SupportedProductNames> = getEnabledProducts()
 * if (enabled.includes('webExperimentation')) {
 *   console.log('Web Experimentation is active')
 * }
 * ```
 */
export type SupportedProductNames = keyof ReturnType<typeof checkProductStatus>

/**
 * Check if Optimizely One services are enabled.
 *
 * Reads the `HelperEnabled` environment variable to determine if the Optimizely
 * One integration is active in this application.
 *
 * This is typically used as a guard to conditionally load or initialize
 * Optimizely One components.
 *
 * @returns `true` if Optimizely One is enabled via environment configuration,
 *          `false` otherwise.
 *
 * @example
 * ```tsx
 * import { isOptimizelyOneEnabled } from '@remkoj/optimizely-one-nextjs'
 *
 * if (isOptimizelyOneEnabled()) {
 *   // Safe to use Optimizely One components
 *   console.log('Optimizely One is enabled')
 * } else {
 *   console.log('Optimizely One is not enabled in this environment')
 * }
 * ```
 */
export function isOptimizelyOneEnabled() : boolean
{
  return EnvTools.readValueAsBoolean(EnvVars.HelperEnabled, false)
}

/**
 * Get an array of enabled Optimizely One product services.
 *
 * Inspects the configuration to determine which Optimizely One products
 * are currently active and returns their names. This is useful for:
 *
 * - Conditional rendering of product-specific features.
 * - Logging which services are available in the environment.
 * - Initializing product-specific contexts or providers.
 *
 * **Product activation rules:**
 *
 * - `dataPlatform`: enabled if `OdpApiKey` is configured with >8 characters.
 * - `contentRecsClient`: enabled if both `ContentRecsClient` and `ContentRecsDelivery` are set.
 * - `contentRecsApi`: enabled if both `ContentRecsClient` and `ContentRecsDeliveryKey` are set.
 * - `webExperimentation`: enabled if `WebExperimentationProject` is configured with >5 characters.
 *
 * @param config - Optional partial Optimizely One configuration.
 *                 If not provided, configuration is read from environment variables.
 * @returns An array of enabled product names (e.g. `['dataPlatform', 'webExperimentation']`).
 *
 * @example
 * ```tsx
 * import { getEnabledProducts } from '@remkoj/optimizely-one-nextjs'
 *
 * const enabledServices = getEnabledProducts()
 * console.log('Active products:', enabledServices)
 * // Output: ['dataPlatform', 'webExperimentation']
 * ```
 *
 * @example
 * ```tsx
 * import { getEnabledProducts } from '@remkoj/optimizely-one-nextjs'
 *
 * // Use with custom configuration for testing
 * const testConfig = {
 *   OdpApiKey: 'test-key-12345678',
 *   WebExperimentationProject: 'test-project'
 * }
 * const services = getEnabledProducts(testConfig)
 * ```
 */
export function getEnabledProducts(config?: Partial<OptiOneConfig>) : Array<SupportedProductNames> {
  const optiOneConfig = config ?? readConfigFromEnv()
  const status = checkProductStatus(optiOneConfig)
  const enabledProducts = (Object.getOwnPropertyNames(status) as Array<keyof typeof status>).reduce((list, currentProductName) => { 
    if (status[currentProductName])
      list.push(currentProductName);
    return list 
  }, [] as Array<keyof typeof status>)
  return enabledProducts
}
