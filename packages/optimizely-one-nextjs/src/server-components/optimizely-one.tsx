// This is a server only component
// import 'server-only';

// Import global libararies and shared utilities
import { PropsWithChildren } from "react";
import { getEnabledProducts } from "../utils/products.js";
import { type OptiOneConfig, readConfigFromEnv, checkProductStatus } from "../config.js";

// Import client-side components that need a server side data
// to render correctly
import { PageActivator } from "../components/page-activator.js";
import { OptimizelyOneProvider } from "../components/context.js";

// Import server side component wrappers for components that are
// server context aware.
import { OptimizelyOneGadget } from './optimizely-one-gadget.js'
import FeatureExperimentationProvider from '../products/feature-experimentation/provider.js';
import { DEFAULT_PROXY_PATH, getDatafilePath, type FeatureExperimentationAttributes, type FeatureExperimentationAttributesResolver } from '../products/feature-experimentation/index.js';

/**
 * Properties for the `OptimizelyOne` root component.
 *
 * `OptimizelyOne` configures and initializes the Optimizely One platform
 * within your Next.js application, managing product services, tracking,
 * and developer gadget visibility.
 *
 * All properties are optional and default to safe, production-appropriate values.
 *
 * @example
 * ```tsx
 * import { OptimizelyOne } from '@remkoj/optimizely-one-nextjs'
 *
 * export default function App({ children }: { children: React.ReactNode }) {
 *   return (
 *     <OptimizelyOne debug={false}>
 *       {children}
 *     </OptimizelyOne>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Development mode with debugging and auto-tracking enabled
 * <OptimizelyOne debug={true} disableAutoTracking={false}>
 *   <YourPageLayout />
 * </OptimizelyOne>
 * ```
 */
export type OptimizelyOneProps = PropsWithChildren<{
  config?: Partial<OptiOneConfig>
  /**
   * Disable automatic page activation and tracking.
   *
   * - `true`: the PageActivator component is not rendered; manual tracking required.
   * - `false` (default): automatic page view tracking is enabled.
   *
   * Set to `true` if you implement custom page activation/tracking logic.
   */
  disableAutoTracking?: boolean

  /**
   * Disable all Optimizely tracking features.
   *
   * - `true`: no events are sent to Optimizely services.
   * - `false` (default): tracking is enabled.
   *
   * Use when: implementing custom tracking only, GDPR/privacy compliance,
   * or testing without analytics.
   */
  disableTracking?: boolean

  /**
   * Enable debug mode for detailed Optimizely One diagnostics.
   *
   * - `true`: enables verbose logging to browser console.
   * - `false` (default): no debug output.
   *
   * Use during development and local testing to troubleshoot integration issues,
   * configuration problems, or service loading failures.
   */
  debug?: boolean

  /**
   * API endpoint path for the Optimizely One gadget data.
   *
   * - Default: `'/api/me'`
   * - Set this to your custom API endpoint path if your API differs from the standard path.
   *
   * This endpoint is used by the developer gadget to fetch user/session data for
   * display in the gadget interface.
   *
   * @example
   * ```tsx
   * <OptimizelyOne apiPath="/api/v2/user-info" debug={true}>
   *   {children}
   * </OptimizelyOne>
   * ```
   */
  apiPath?: string

  /**
   * Refresh interval (in milliseconds) for gadget data updates.
   *
   * - Default: `0`
   * - `0` means data is refreshed **only** when a tab is activated (brought into focus).
   *   No automatic background updates occur.
   * - `> 0`: enables automatic polling at the specified interval (in milliseconds).
   *   For example, `30000` refreshes every 30 seconds.
   * - `null` or `undefined`: defaults to `0` (tab activation only).
   *
   * **Recommendation:** Use `0` (default) for production to minimize background
   * network activity. Use `> 0` during development for real-time monitoring.
   *
   * @example
   * ```tsx
   * // Production: refresh only on tab activation (default)
   * <OptimizelyOne>
   *   {children}
   * </OptimizelyOne>
   * ```
   *
   * @example
   * ```tsx
   * // Development: refresh every 10 seconds for monitoring
   * <OptimizelyOne gadgetRefreshInterval={10000} debug={true}>
   *   {children}
   * </OptimizelyOne>
   * ```
   *
   * @example
   * ```tsx
   * // Explicit tab-only activation
   * <OptimizelyOne gadgetRefreshInterval={0}>
   *   {children}
   * </OptimizelyOne>
   * ```
   */
  gadgetRefreshInterval?: number

  /**
   * Base path of the Feature Experimentation proxy endpoints.
   *
   * - Default: `'/api/fx'`
   * - Only used when `OPTIMIZELY_FX_PROXY` is enabled: the browser then reads the datafile
   *   from `<fxProxyPath>/datafile` instead of the Optimizely CDN.
   * - Must include the `basePath` of the application, if there is one.
   */
  fxProxyPath?: string

  /**
   * Initial attributes of the visitor, to use for Feature Experimentation decisions in the
   * browser. Must be serializable and must not depend on the request: reading `cookies()`
   * or `headers()` here makes the layout dynamic. Use `fxResolveAttributes` for those.
   */
  fxAttributes?: FeatureExperimentationAttributes

  /**
   * The ODP real-time audiences (segments) of the visitor when fetched on the server
   * (`getQualifiedSegments`), so the browser doesn't fetch them from ODP for its
   * decisions. Visitor specific, so only usable in layouts that are dynamic already;
   * without it the browser fetches the segments itself.
   */
  fxQualifiedSegments?: string[]

  /**
   * A Server Function (`'use server'`, which can use `cookies()` and `headers()`) or client
   * function that determines more attributes of the visitor. It is executed asynchronously
   * in the browser, once per visitor, and its result is merged into `fxAttributes`, which
   * updates the decisions. This keeps the layout static while still using request context.
   * Use the same function in server-side decisions to make both sides decide for the same visitor.
   * Client functions cannot be passed from a Server Component; render
   * `<ResolveFeatureExperimentationAttributes resolve={...} />` (client entry) for those.
   */
  fxResolveAttributes?: FeatureExperimentationAttributesResolver
}>

/**
 * Root provider component for Optimizely One integration in Next.js applications.
 *
 * `OptimizelyOne` initializes the Optimizely One platform services and wraps
 * your application content with the necessary context and configuration. It handles:
 *
 * - Loading enabled Optimizely products from configuration.
 * - Injecting the PageActivator for automatic page view tracking (when enabled).
 * - Providing CMS context to child components.
 * - Rendering the developer gadget (when enabled).
 *
 * **Key Behavior:**
 *
 * - If `disableAutoTracking` is `false` (default), automatic page view tracking
 *   is enabled via the `PageActivator` component.
 * - If the `OPTIMIZELY_ONE_HELPER` environment variable is true, the developer
 *   gadget is included in the page; it stays hidden in the browser until an
 *   Optimizely test cookie (`optly_<domain name>_test`) is present. Otherwise the
 *   gadget is never included.
 * - The `debug` flag affects internal context and may influence child
 *   component logging behavior.
 * - All disabled flags default to `false`, enabling features by default.
 *
 * **Where to use:**
 *
 * Place `OptimizelyOne` as high as possible in your component tree, typically
 * in your root layout or top-level page component.
 *
 * @param props - Configuration properties for Optimizely One initialization.
 * @param props.disableAutoTracking - Set to `true` to prevent automatic page activation/tracking.
 * @param props.disableTracking - Set to `true` to disable all tracking to Optimizely.
 * @param props.debug - Set to `true` to enable verbose debug logging.
 * @param props.fxProxyPath - Base path of the Feature Experimentation proxy endpoints, defaults to `/api/fx`.
 * @param props.fxAttributes - Initial attributes of the visitor for browser-side Feature Experimentation decisions.
 * @param props.fxQualifiedSegments - ODP real-time audiences of the visitor, when already known on the server.
 * @param props.fxResolveAttributes - Server Function that updates the attributes of the visitor asynchronously.
 * @param props.children - Nested React content to render within the Optimizely One context.
 * @returns A provider component that wraps children with Optimizely One context.
 *
 * @example
 * ```tsx
 * // Basic usage in Next.js layout
 * import { OptimizelyOne } from '@remkoj/optimizely-one-nextjs'
 *
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <html>
 *       <body>
 *         <OptimizelyOne>
 *           <Header />
 *           <main>{children}</main>
 *           <Footer />
 *         </OptimizelyOne>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Development configuration with debug and tracking control
 * import { OptimizelyOne } from '@remkoj/optimizely-one-nextjs'
 *
 * const isDevelopment = process.env.NODE_ENV === 'development'
 *
 * export function RootProvider({ children }: { children: React.ReactNode }) {
 *   return (
 *     <OptimizelyOne
 *       debug={isDevelopment}
 *       disableAutoTracking={false}
 *       disableTracking={false}
 *     >
 *       {children}
 *     </OptimizelyOne>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Privacy-first configuration with tracking disabled
 * <OptimizelyOne
 *   disableTracking
 *   disableAutoTracking
 *   debug={false}
 * >
 *   <App />
 * </OptimizelyOne>
 * ```
 */
export function OptimizelyOne({
  config: partialConfig,
  apiPath,
  disableAutoTracking = false,
  disableTracking = false,
  debug: requestedDebug,
  children,
  gadgetRefreshInterval = 0,
  fxProxyPath = DEFAULT_PROXY_PATH,
  fxAttributes,
  fxQualifiedSegments,
  fxResolveAttributes
}: OptimizelyOneProps) {
  const config = partialConfig ? { ...readConfigFromEnv(), ...partialConfig } : readConfigFromEnv();
  const enabledProducts = getEnabledProducts(config);
  const fxSdkKey = config.FeatureExperimentationSdkKey;
  const frontendCookie = config.FrontendCookie;
  const debug = requestedDebug === undefined ? config.OptimizelyDebug ?? false : requestedDebug;
  return (
    <OptimizelyOneProvider value={{ debug, disableAutotracking: disableAutoTracking, disableTracking }} enabledOptimizelyServices={ enabledProducts }>
      {fxSdkKey ?
        <FeatureExperimentationProvider sdkKey={fxSdkKey} frontendCookie={frontendCookie} debug={debug} datafileUrl={config.FeatureExperimentationProxy ? getDatafilePath(fxProxyPath) : undefined} odpEnabled={checkProductStatus(config).dataPlatform} attributes={fxAttributes} qualifiedSegments={fxQualifiedSegments} resolveAttributes={fxResolveAttributes}>
          <>
            {!disableAutoTracking && <PageActivator />}
            {children}
            {config.HelperEnabled && <OptimizelyOneGadget servicePrefix={apiPath} refreshInterval={gadgetRefreshInterval} />}
          </>
        </FeatureExperimentationProvider> :
        <>
          {!disableAutoTracking && <PageActivator />}
          {children}
          {config.HelperEnabled && <OptimizelyOneGadget servicePrefix={apiPath} refreshInterval={gadgetRefreshInterval} />}
        </>
      }
    </OptimizelyOneProvider>
  )
}
