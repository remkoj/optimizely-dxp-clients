import type * as Types from './types.js'
import { OptiCmsSchema, SchemaVersion } from "./client/types.js"
import { expand } from 'dotenv-expand'

export type { ContentGraphConfig, OptimizelyGraphConfigInternal, OptimizelyGraphConfig } from './types.js'
export { OptiCmsSchema, SchemaVersion } from "./client/types.js"

/**
 * The name of the HTTP header that carries the publish secret when Optimizely Graph
 * calls the publish webhook, unless overridden using `OPTIMIZELY_PUBLISH_HEADER`.
 */
export const DEFAULT_PUBLISH_HEADER = 'X-OPTLY-PUBLISH'

/**
 * The environment variables of which the `${VAR}` references are expanded by
 * {@link readEnvironmentVariables} itself. Other loaders of `.env` files (such as
 * the CLI) must leave these as-is, so a value is expanded at most once.
 */
export const EXPANDED_BY_CONFIG: readonly string[] = ['OPTIMIZELY_PUBLISH_TOKEN', 'OPTIMIZELY_PUBLISH_HEADER']

const HEADER_NAME_TOKEN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/
const ENV_REFERENCE = /\$\{[^{}]+\}/

/**
 * Read the configuration from the environment variables
 *
 * @returns The configuration, as defined by the environment variables
 * @throws  When `OPTIMIZELY_PUBLISH_HEADER` is not a valid HTTP header name, or refers to an
 *          environment variable that is not set
 */
export function readEnvironmentVariables(): Types.OptimizelyGraphConfig {
  const config: Types.OptimizelyGraphConfig = {
    secret: getOptional('OPTIMIZELY_GRAPH_SECRET', () => getOptional('OPTIMIZELY_CONTENTGRAPH_SECRET')),
    app_key: getOptional('OPTIMIZELY_GRAPH_APP_KEY', () => getOptional('OPTIMIZELY_CONTENTGRAPH_APP_KEY')),
    single_key: getOptional('OPTIMIZELY_GRAPH_SINGLE_KEY', () => getOptional('OPTIMIZELY_CONTENTGRAPH_SINGLE_KEY', '')) as string,
    gateway: getOptional('OPTIMIZELY_GRAPH_GATEWAY', () => getOptional('OPTIMIZELY_CONTENTGRAPH_GATEWAY', 'https://cg.optimizely.com')),
    tenant_id: getOptional('OPTIMIZELY_GRAPH_TENANT_ID'),
    deploy_domain: resolveDeploymentDomain(),
    dxp_url: getOptional('OPTIMIZELY_CMS_URL', () => getOptional('DXP_URL')),
    query_log: getBoolean('OPTIMIZELY_GRAPH_QUERY_LOG', () => getBoolean('OPTIMIZELY_CONTENTGRAPH_QUERY_LOG', false)),
    debug: getBoolean('OPTIMIZELY_DEBUG', () => getBoolean('DXP_DEBUG', false)),
    publish: getExpandedOptional('OPTIMIZELY_PUBLISH_TOKEN'),
    publish_header: resolvePublishHeader(getOptional('OPTIMIZELY_PUBLISH_HEADER'), 'OPTIMIZELY_PUBLISH_HEADER'),
    opti_cms_schema: getSelection<OptiCmsSchema>('OPTIMIZELY_CMS_SCHEMA', [OptiCmsSchema.CMS12, OptiCmsSchema.CMS13], OptiCmsSchema.CMS13),
    graph_schema: getSelection<SchemaVersion>('OPTIMIZELY_GRAPH_SCHEMA', [SchemaVersion.Default, SchemaVersion.Next], SchemaVersion.Default)
  }
  // Make sure that the Gateway is normalized
  if (config.gateway && config.gateway?.endsWith("/"))
    config.gateway = config.gateway.substring(0, config.gateway.length - 1)

  // Make sure that the Optimizely CMS Domain is adjusted correctly
  if (config.dxp_url && config.dxp_url != "" && !config.dxp_url.includes("://"))
    config.dxp_url = "https://" + config.dxp_url

  // Normalize the deployment domain
  if (config.deploy_domain && config.deploy_domain != "" && config.deploy_domain.includes("://"))
    try {
      const nd = new URL(config.deploy_domain)
      config.deploy_domain = nd.host
    } catch {
      config.deploy_domain = config.deploy_domain.substring(config.deploy_domain.indexOf("://") + 3)
    }

  if (config.debug)
    console.log("🚧 Detected configuration from Environment Variables:", JSON.stringify({
      ...config,
      secret: maskCredential(config.secret),
      app_key: maskCredential(config.app_key),
      single_key: maskCredential(config.single_key),
      publish: maskCredential(config.publish)
    }))

  return config
}

function maskCredential(value: string | undefined): string | undefined {
  return value ? '***' : undefined
}

/**
 * Expand `${VAR}` references in a configuration value against the current
 * environment variables (dotenv-expand semantics), without modifying `process.env`.
 * The expansion is a single pass: the values of the referenced variables are used
 * as-is, and unbraced `$name` text is left alone. A reference can be escaped as
 * `\${NAME}` to keep it as literal text. Values without a reference are returned
 * as-is, so secrets containing `$` are never altered.
 *
 * @param   value   The raw value
 * @returns The expanded value, which is empty when it refers to a variable that is not set
 */
function expandReferences(value: string): string {
  if (!ENV_REFERENCE.test(value))
    return value
  // A plain ${NAME} that is not set must never yield a partial secret, such as 'prefix-'
  for (const [, name] of value.matchAll(/(?<!\\)\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g))
    if (!process.env[name])
      return ''
  // Escape what dotenv-expand must not expand: unbraced $names in the value, and
  // any $ in the referenced values, so the outcome is expanded exactly once
  const parsed = { value: value.replace(/(?<!\\)\$(?=[A-Za-z_])/g, '\\$') }
  const processEnv: Record<string, string> = {}
  for (const [name, text] of Object.entries(process.env))
    if (typeof text == 'string')
      processEnv[name] = text.replaceAll('$', '\\$')
  expand({ parsed, processEnv })
  return parsed.value.trim()
}

function getExpandedOptional(envVarName: string): string | undefined {
  const raw = getOptional(envVarName)
  if (raw == undefined)
    return undefined
  const expanded = expandReferences(raw)
  if (expanded == "") {
    console.warn(`⚠️ [Optimizely Graph] ${envVarName} refers to an environment variable that is not set, treating it as not configured`)
    return undefined
  }
  return expanded
}

/**
 * Resolve the name of the HTTP header that carries the publish secret.
 *
 * @param   configured  The configured value; `${VAR}` references are expanded
 * @param   source      The name of the setting, used in messages only
 * @returns The configured header name, or {@link DEFAULT_PUBLISH_HEADER} when empty
 * @throws  When the configured value refers to an environment variable that is not set, or is
 *          not a valid HTTP header name (RFC 7230 token)
 */
export function resolvePublishHeader(configured?: string, source: string = 'OPTIMIZELY_PUBLISH_HEADER'): string {
  const name = configured == undefined ? '' : expandReferences(configured.trim())
  if (name == '') {
    if (configured != undefined && configured.trim() != '')
      throw new Error(`❌ [Optimizely Graph] ${source} refers to an environment variable that is not set`)
    return DEFAULT_PUBLISH_HEADER
  }
  if (!HEADER_NAME_TOKEN.test(name))
    throw new Error(`❌ [Optimizely Graph] ${source} must be a valid HTTP header name (letters, digits and !#$%&'*+-.^_\`|~)`)
  return name
}

/**
 * Apply the default values to a (partial) configuration
 *
 * @param   configuredValues  The configuration
 * @returns The configuration with all defaults applied
 */
export function applyConfigDefaults(configuredValues: Types.OptimizelyGraphConfig): Types.OptimizelyGraphConfigInternal {
  const defaults: Types.OptimizelyGraphConfigInternal = {
    single_key: "",
    gateway: "https://cg.optimizely.com",
    dxp_url: "",
    deploy_domain: "",
    debug: false,
    query_log: false,
    opti_cms_schema: OptiCmsSchema.CMS13,
    graph_schema: SchemaVersion.Default,
    publish_header: DEFAULT_PUBLISH_HEADER
  }
  const config = {
    ...defaults,
    ...configuredValues
  }
  config.publish_header = resolvePublishHeader(config.publish_header)
  if (config.gateway && config.gateway?.endsWith("/"))
    config.gateway = config.gateway.substring(0, config.gateway.length - 1)
  return config
}

/**
 * Resolve the deployment domain based upon either configuration specific to 
 * this package, or well known environment variables of FE hosting providers.
 * 
 * @returns The resolved deployment domain
 */
export function resolveDeploymentDomain(): string | undefined {
  // First resolve based upon Optimizely Frontend configuration
  const opti_variables = getOptional('SITE_DOMAIN', () => getOptional('SITE_PRIMARY'));
  if (opti_variables && opti_variables != "")
    return opti_variables

  // Then try to resolve based upon Vercel environment variables
  const vercelEnv = getOptional('VERCEL_TARGET_ENV')
  if (vercelEnv && vercelEnv != 'development') {
    const vercelDomain = vercelEnv == 'production' ? getOptional('VERCEL_PROJECT_PRODUCTION_URL') : getOptional('VERCEL_BRANCH_URL');
    if (vercelDomain && vercelDomain != "")
      return vercelDomain;
  }

  // Then try to resolve based upon Netlify environment variables
  const netlifyEnv = getOptional('CONTEXT')
  if (netlifyEnv && netlifyEnv != 'dev') {
    const netlifyDomain = netlifyEnv == 'production' ? getOptional('URL') : getOptional('DEPLOY_PRIME_URL');
    if (netlifyDomain && netlifyDomain != "")
      return netlifyDomain
  }

  // Well, now we just give up...
  return undefined
}

/**
 * Validate the configuration
 * 
 * @param toValidate The configuration object
 * @param forPublishedOnly Whether to only validate for published content access
 * @returns 
 */
export function validateConfig(toValidate: Types.OptimizelyGraphConfig, forPublishedOnly: boolean = true, throwError: boolean = false): toValidate is Types.OptimizelyGraphConfigInternal {
  const hasSingleKey = isNonEmptyString(toValidate?.single_key)
  const hasGateway = isValidUrl(toValidate?.gateway)
  const hasSecret = forPublishedOnly || isNonEmptyString(toValidate?.secret)
  const hasAppKey = forPublishedOnly || isNonEmptyString(toValidate?.app_key)

  if (throwError && !hasSingleKey)
    throw new Error("Optimizely Graph Configuration does not have a valid Single Key")
  if (throwError && !hasGateway)
    throw new Error("Optimizely Graph Configuration does not have a valid Gateway")
  if (throwError && !hasSecret)
    throw new Error("Optimizely Graph Configuration does not have a valid Secret")
  if (throwError && !hasAppKey)
    throw new Error("Optimizely Graph Configuration does not have a valid App Key")
  return hasGateway && hasSingleKey && hasAppKey && hasSecret
}

function isNonEmptyString(toTest: any): toTest is string {
  return typeof (toTest) == 'string' && toTest.length > 0
}

function isValidUrl(toTest: any): boolean {
  if (!isNonEmptyString(toTest))
    return false
  try {
    const u = new URL(toTest)
    if (u.protocol != 'https:')
      return false
    return true
  } catch {
    return false
  }
}

function getBoolean(envVarName: string, defaultValue: boolean | (() => boolean) = false): boolean {
  const currentValue = getOptional(envVarName)
  if (!currentValue) {
    if (typeof (defaultValue) == 'function')
      return defaultValue()
    return defaultValue
  }
  return currentValue == '1' || currentValue.toLowerCase() == 'true'
}

function getMandatory(envVarName: string): string {
  let value: string | undefined = undefined
  try {
    value = process.env[envVarName]
  } catch {
    // Ignore on purpose
  }
  if (value == null || value == undefined || value.trim() == "")
    throw new Error(`The environment variable ${envVarName} is required, but not set`)

  return value.trim()
}

function getOptional(envVarName: string, defaultValue?: string | (() => string | undefined) | undefined): string | undefined {
  try {
    return getMandatory(envVarName)
  } catch {
    if (typeof (defaultValue) == 'function')
      return defaultValue()
    return defaultValue
  }
}

function getSelection<T>(envVarName: string, allowedValues: T[], defaultValue: T): T {
  const rawValue = getOptional(envVarName, defaultValue as string)
  if (!rawValue)
    return defaultValue
  if (allowedValues.some(av => av == rawValue))
    return rawValue as T
  return defaultValue
}
