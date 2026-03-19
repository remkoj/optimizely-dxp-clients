import { PropsWithChildren } from "react";
import { getEnabledProducts } from "../utils/products";

// Import client-side components that need a server side data
// to render correctly
import { PageActivator } from "./page-activator";
import { OptimizelyOneProvider } from "./context";

// Import server side component wrappers for components that are
// server context aware.
import { OptimizelyOneGadget } from './optimizely-one-gadget'

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
   * Disable the Optimizely One developer gadget.
   *
   * - `true`: gadget is not rendered.
   * - `false` (default): gadget is rendered in the page.
   *
   * The gadget provides debugging tools and inspection capabilities.
   * Recommended: hide in production with `disableGadget={!isDevelopment}`.
   */
  disableGadget?: boolean

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
 * - If `disableGadget` is `false` (default), the developer gadget is rendered
 *   in the DOM for debugging/inspection.
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
 * @param props.disableGadget - Set to `true` to hide the developer gadget.
 * @param props.debug - Set to `true` to enable verbose debug logging.
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
 *       disableGadget={!isDevelopment}
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
 *   disableGadget
 *   debug={false}
 * >
 *   <App />
 * </OptimizelyOne>
 * ```
 */
export function OptimizelyOne({
  apiPath,
  disableAutoTracking = false,
  disableTracking = false,
  disableGadget = false,
  debug = false,
  children,
  gadgetRefreshInterval = 0
}: OptimizelyOneProps) {
  const enabledProducts = getEnabledProducts();
  return <>
    <OptimizelyOneProvider value={{ debug, disableAutotracking: disableAutoTracking, disableTracking }} enabledOptimizelyServices={ enabledProducts }>
      {!disableAutoTracking && <PageActivator />}
      {children}
      <OptimizelyOneGadget show={ disableGadget ? false : undefined } servicePrefix={ apiPath } refreshInterval={ gadgetRefreshInterval } />
    </OptimizelyOneProvider>
  </>
}
