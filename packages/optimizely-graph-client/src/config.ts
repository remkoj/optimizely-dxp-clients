import type * as Types from './types.js'
import { OptiCmsSchema, SchemaVersion } from "./client/types.js"

export type { ContentGraphConfig, OptimizelyGraphConfigInternal, OptimizelyGraphConfig } from './types.js'
export { OptiCmsSchema, SchemaVersion } from "./client/types.js"

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
    publish: getOptional('OPTIMIZELY_PUBLISH_TOKEN'),
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
    console.log("🚧 Detected configuration from Environment Variables:", JSON.stringify(config))

  return config
}

export function readVercelEnvironmentVariables(): Types.VercelEnvironmentVariables {
  const config: Types.VercelEnvironmentVariables = {
    automation_bypass_secret: getOptional('VERCEL_AUTOMATION_BYPASS_SECRET'),
    target_env: getOptional('VERCEL_TARGET_ENV'),
    project_production_url: getOptional('VERCEL_PROJECT_PRODUCTION_URL'),
    branch_url: getOptional('VERCEL_BRANCH_URL')
  }
  
  return config
}  

export function applyConfigDefaults(configuredValues: Types.OptimizelyGraphConfig): Types.OptimizelyGraphConfigInternal {
  const defaults: Types.OptimizelyGraphConfigInternal = {
    single_key: "",
    gateway: "https://cg.optimizely.com",
    dxp_url: "",
    deploy_domain: "",
    debug: false,
    query_log: false,
    opti_cms_schema: OptiCmsSchema.CMS13,
    graph_schema: SchemaVersion.Default
  }
  const config = {
    ...defaults,
    ...configuredValues
  }
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
function resolveDeploymentDomain(): string | undefined {
  // First resolve based upon Optimizely Frontend configuration
  const opti_variables = getOptional('SITE_DOMAIN', () => getOptional('SITE_PRIMARY'));
  if (opti_variables && opti_variables != "")
    return opti_variables

  // Then try to resolve based upon Vercel environment variables
  const vercelEnv = readVercelEnvironmentVariables().target_env
  if (vercelEnv && vercelEnv != 'development') {
    const vercelDomain = vercelEnv == 'production' ? readVercelEnvironmentVariables().project_production_url : readVercelEnvironmentVariables().branch_url;
    if (vercelDomain && vercelDomain != "")
      return vercelDomain
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
    var u = new URL(toTest)
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
  } catch (e) {
    // Ignore on purpose
  }
  if (value == null || value == undefined || value.trim() == "")
    throw new Error(`The environment variable ${envVarName} is required, but not set`)

  return value.trim()
}

function getOptional(envVarName: string, defaultValue?: string | (() => string | undefined) | undefined): string | undefined {
  try {
    return getMandatory(envVarName)
  } catch (e) {
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