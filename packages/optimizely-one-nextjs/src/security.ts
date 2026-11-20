import { readConfigFromEnv, type OptiOneConfig } from './config.js'

const DATA_PLATFORM_SCRIPT_ORIGIN = 'https://d1igp3oop3iho5.cloudfront.net'
const WEB_EXPERIMENTATION_CDN = 'https://cdn.optimizely.com'
const WEB_EXPERIMENTATION_LOGGING = 'https://logx.optimizely.com/v1/events'
// The Web Experimentation visual editor injects its scripts and styles from the
// Optimizely app into the site, which it frames while editing.
const WEB_EXPERIMENTATION_EDITOR = [
  'https://app.optimizely.com',
  'https://*.app.optimizely.com',
  'https://opal.optimizely.com',
  'https://*.opal.optimizely.com',
  'https://opal-tools.optimizely.com'
]
const WEB_EXPERIMENTATION_EDITOR_API = [
  'https://opal-backend.optimizely.com',
  'wss://*.app.optimizely.com',
  'wss://ws.opal.optimizely.com',
  'wss://opal-tools.optimizely.com',
  'https://stats.g.doubleclick.net',
  'https://cdn.segment.com',
  'https://api.segment.io'
]
// The visual editor loads Google Analytics for its own usage reporting
const WEB_EXPERIMENTATION_EDITOR_ANALYTICS = 'https://*.google-analytics.com'

/**
 * External resource origins grouped by CSP directive.
 */
export type SecurityPolicySources = {
  /** External script sources required by enabled Optimizely products. */
  'script-src': string[]
  /** External connection sources required by enabled Optimizely products. */
  'connect-src': string[]
  /** External image sources required by enabled Optimizely products. */
  'img-src': string[]
  /** External frame sources required by enabled Optimizely products. */
  'frame-src': string[]
  /** External style sources required by enabled Optimizely products. */
  'style-src': string[]
  /** External font sources required by enabled Optimizely products. */
  'font-src': string[]
  /** Worker sources required by enabled Optimizely products. */
  'worker-src': string[]
}

/**
 * Configuration accepted by the CSP helpers: the Optimizely One configuration plus CSP-only options.
 */
export type SecurityPolicyConfig = Partial<OptiOneConfig> & {
  /**
   * Include the Web Experimentation visual editor (VE) sources. The VE sources are included when this
   * is `undefined`, `null` or `true`, so the editor works by default; set `false` to omit them.
   * Ignored (all Web Experimentation sources are omitted) when Web Experimentation is not configured.
   */
  webExVeActive?: boolean | null
}

/**
 * A resource hint for a remote origin used by the tracking snippets.
 */
export type OptimizelyResourceHint = {
  /** Origin to establish an early connection to. */
  href: string
  /** CORS mode for origins that the browser fetches cross-origin. */
  crossOrigin?: 'anonymous'
}

/**
 * Options that affect which snippet origins require a preconnect hint.
 */
export type OptimizelyResourceHintOptions = {
  /** Skip the remote Web Experimentation CDN when its script is served by a local proxy. */
  webExperimentationUseProxy?: boolean
}

/**
 * Gets the unique origins used by the enabled products' tracking scripts and API links.
 *
 * @param config Optional partial configuration; omitted values use environment defaults.
 * @param options Snippet options that affect remote resource loading.
 * @returns Deduplicated origins with CORS mode where applicable.
 */
export function getOptimizelyResourceHints(
  config?: Partial<OptiOneConfig>,
  options: OptimizelyResourceHintOptions = {}
): OptimizelyResourceHint[] {
  const resolvedConfig = { ...readConfigFromEnv(), ...config }
  const odpId = resolvedConfig.OdpApiKey?.split('.').shift() ?? ''
  const hasWebExperimentation = Boolean(resolvedConfig.WebExperimentationProject)
  const hasContentRecs = Boolean(resolvedConfig.ContentRecsClient && resolvedConfig.ContentRecsDelivery)
  const origins = new Map<string, boolean>()
  const addOrigin = (url: string, crossOrigin = false) => {
    const origin = new URL(url).origin
    origins.set(origin, (origins.get(origin) ?? false) || crossOrigin)
  }

  if (odpId) {
    addOrigin(new URL(`/v2/${odpId}/zaius.js`, DATA_PLATFORM_SCRIPT_ORIGIN).href)
    addOrigin(resolvedConfig.OdpService, true)
  }

  if (hasWebExperimentation) {
    if (!options.webExperimentationUseProxy) {
      addOrigin(new URL(`/js/${resolvedConfig.WebExperimentationProject}.js`, WEB_EXPERIMENTATION_CDN).href)
    }
    addOrigin(WEB_EXPERIMENTATION_LOGGING, true)
  }

  if (hasContentRecs) {
    const host = resolvedConfig.ContentRecsHost || 'idio.co'
    addOrigin(new URL('/ia.js', `https://s.${host}`).href)
  }

  return [...origins].map(([href, crossOrigin]) => ({
    href,
    ...(crossOrigin ? { crossOrigin: 'anonymous' as const } : {})
  }))
}

/**
 * Gets external CSP sources required by the configured products.
 *
 * The returned values are external sources only; callers should retain their
 * own base policy and add any application-specific sources.
 *
 * @param config Optional partial configuration, including `webExVeActive`; omitted values use environment defaults.
 * @returns External origins grouped by CSP directive.
 */
export function getSecurityPolicySources(config?: SecurityPolicyConfig): SecurityPolicySources {
  const resolvedConfig = { ...readConfigFromEnv(), ...config }
  const odpId = resolvedConfig.OdpApiKey?.split('.').shift() ?? ''
  const hasWebExperimentation = Boolean(resolvedConfig.WebExperimentationProject)
  const hasContentRecs = Boolean(resolvedConfig.ContentRecsClient && resolvedConfig.ContentRecsDelivery)
  const sources: SecurityPolicySources = {
    'script-src': [],
    'connect-src': [],
    'img-src': [],
    'frame-src': [],
    'style-src': [],
    'font-src': [],
    'worker-src': []
  }

  if (hasWebExperimentation) {
    sources['script-src'].push(WEB_EXPERIMENTATION_CDN, 'https://*.cdn.optimizely.com', "'unsafe-eval'")
    sources['connect-src'].push(
      WEB_EXPERIMENTATION_CDN,
      'https://*.cdn.optimizely.com',
      new URL(WEB_EXPERIMENTATION_LOGGING).origin,
      'https://rum.optimizely.com',
      'https://prediction.cmab.optimizely.com'
    )
    sources['frame-src'].push(WEB_EXPERIMENTATION_CDN, 'https://*.cdn.optimizely.com')

    if (resolvedConfig.webExVeActive !== false) {
      sources['script-src'].push(...WEB_EXPERIMENTATION_EDITOR, WEB_EXPERIMENTATION_EDITOR_ANALYTICS)
      sources['connect-src'].push(
        ...WEB_EXPERIMENTATION_EDITOR,
        ...WEB_EXPERIMENTATION_EDITOR_API,
        WEB_EXPERIMENTATION_EDITOR_ANALYTICS
      )
      sources['frame-src'].push(...WEB_EXPERIMENTATION_EDITOR)
      sources['style-src'].push(...WEB_EXPERIMENTATION_EDITOR)
      sources['font-src'].push(...WEB_EXPERIMENTATION_EDITOR)
      // The visual editor runs a Session Replay worker from a blob URL
      sources['worker-src'].push('blob:')
    }
  }

  if (odpId) {
    const odpOrigin = new URL(resolvedConfig.OdpService).origin
    sources['script-src'].push(DATA_PLATFORM_SCRIPT_ORIGIN)
    sources['connect-src'].push(DATA_PLATFORM_SCRIPT_ORIGIN, odpOrigin, 'https://*.odp.optimizely.com')
    sources['img-src'].push(odpOrigin)
  }

  if (hasContentRecs) {
    const host = resolvedConfig.ContentRecsHost || 'idio.co'
    sources['script-src'].push(new URL('/ia.js', `https://s.${host}`).origin)
    sources['connect-src'].push(`https://*.${host}`)
    sources['img-src'].push(`https://*.${host}`, 'https://i.idio.co')
  }

  for (const directive of Object.keys(sources) as (keyof SecurityPolicySources)[]) {
    sources[directive] = [...new Set(sources[directive])]
  }
  return sources
}

/**
 * Builds CSP directives for enabled Optimizely products and merges host sources.
 *
 * @param extra Additional host-provided sources grouped by CSP directive.
 * @param config Optional partial configuration, including `webExVeActive`; omitted values use environment defaults.
 * @returns A CSP string containing the directives used by these products; directives without sources are omitted.
 */
export function buildContentSecurityPolicy(
  extra: Partial<SecurityPolicySources> = {},
  config?: SecurityPolicyConfig
): string {
  const productSources = getSecurityPolicySources(config)
  return (Object.keys(productSources) as (keyof SecurityPolicySources)[])
    .map((directive) => {
      const sources = [...new Set([...(extra[directive] ?? []), ...productSources[directive]])]
      return sources.length > 0 ? `${directive} ${sources.join(' ')}` : undefined
    })
    .filter((directive): directive is string => directive !== undefined)
    .join('; ')
}

/**
 * Builds CSP and COOP headers for an application using Optimizely products.
 *
 * @param extra Additional host-provided CSP sources grouped by directive.
 * @param config Optional partial configuration, including `webExVeActive`; omitted values use environment defaults.
 * @returns Security headers containing the product CSP directives and recommended COOP value.
 */
export function buildOptimizelySecurityHeaders(
  extra: Partial<SecurityPolicySources> = {},
  config?: SecurityPolicyConfig
): {
  'Content-Security-Policy': string
  'Cross-Origin-Opener-Policy': 'same-origin'
} {
  return {
    'Content-Security-Policy': buildContentSecurityPolicy(extra, config),
    'Cross-Origin-Opener-Policy': 'same-origin'
  }
}

/**
 * Options for applying request-dependent security headers.
 */
export type DynamicSecurityHeadersOptions = {
  /**
   * Include the Web Experimentation visual editor (VE) sources for this request. Overrides
   * `config.webExVeActive`; `undefined`, `null` and `true` include the VE sources, `false` omits them.
   */
  webExVeActive?: boolean | null
  /** Additional request-dependent sources, merged with `base`. */
  extra?: Partial<SecurityPolicySources>
  /** Optional partial configuration; omitted values use environment defaults. */
  config?: SecurityPolicyConfig
}

/**
 * Sets the complete security headers for the current request, for use in a Next.js proxy.
 *
 * A proxy cannot read the headers set by `headers()` in `next.config`, and a
 * Content-Security-Policy set here replaces that static one. Pass the same
 * `base` sources that `next.config` uses, so the policy only gains the sources
 * that depend on the request.
 *
 * @param headers The response headers to update, typically `response.headers`; modified in place.
 * @param base The host's base sources, identical to those used for the static policy.
 * @param options Request-dependent options: `webExVeActive`, additional `extra` sources and `config`.
 * @returns The updated headers.
 */
export function applyDynamicSecurityHeaders(
  headers: Headers,
  base: Partial<SecurityPolicySources>,
  options: DynamicSecurityHeadersOptions = {}
): Headers {
  const { webExVeActive, extra = {}, config } = options
  const merged: Partial<SecurityPolicySources> = {}
  for (const directive of new Set([...Object.keys(base), ...Object.keys(extra)]) as Set<keyof SecurityPolicySources>)
    merged[directive] = [...(base[directive] ?? []), ...(extra[directive] ?? [])]
  const policyConfig = webExVeActive === undefined ? config : { ...config, webExVeActive }
  for (const [name, value] of Object.entries(buildOptimizelySecurityHeaders(merged, policyConfig)))
    headers.set(name, value)
  return headers
}
