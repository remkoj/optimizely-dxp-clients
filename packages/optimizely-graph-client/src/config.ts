import type * as Types from './types.js'
import { OptiCmsSchema, SchemaVersion } from "./client/types.js"

export type { ContentGraphConfig, OptimizelyGraphConfigInternal, OptimizelyGraphConfig } from './types.js'
export { OptiCmsSchema, SchemaVersion } from "./client/types.js"

export function readEnvironmentVariables() : Types.OptimizelyGraphConfig
{
    const config : Types.OptimizelyGraphConfig = {
        secret: getOptional('OPTIMIZELY_GRAPH_SECRET', () => getOptional('OPTIMIZELY_CONTENTGRAPH_SECRET')),
        app_key: getOptional('OPTIMIZELY_GRAPH_APP_KEY', () => getOptional('OPTIMIZELY_CONTENTGRAPH_APP_KEY')),
        single_key: getOptional('OPTIMIZELY_GRAPH_SINGLE_KEY', () => getOptional('OPTIMIZELY_CONTENTGRAPH_SINGLE_KEY', '')) as string,
        gateway: getOptional('OPTIMIZELY_GRAPH_GATEWAY', () => getOptional('OPTIMIZELY_CONTENTGRAPH_GATEWAY', 'https://cg.optimizely.com')),
        tenant_id: getOptional('OPTIMIZELY_GRAPH_TENANT_ID'),
        deploy_domain: getOptional('SITE_DOMAIN', () => getOptional('SITE_PRIMARY')),
        dxp_url: getOptional('OPTIMIZELY_CMS_URL', () => getOptional('DXP_URL')),
        query_log: getBoolean('OPTIMIZELY_GRAPH_QUERY_LOG', () => getBoolean('OPTIMIZELY_CONTENTGRAPH_QUERY_LOG', false)),
        debug: getBoolean('OPTIMIZELY_DEBUG', () => getBoolean('DXP_DEBUG', false)),
        publish: getOptional('OPTIMIZELY_PUBLISH_TOKEN'),
        opti_cms_schema: getSelection<OptiCmsSchema>('OPTIMIZELY_CMS_SCHEMA', [OptiCmsSchema.CMS12,OptiCmsSchema.CMS13], OptiCmsSchema.CMS13),
        graph_schema: getSelection<SchemaVersion>('OPTIMIZELY_GRAPH_SCHEMA', [SchemaVersion.Default, SchemaVersion.Next], SchemaVersion.Default)
    }
    // Make sure that the Gateway is normalized
    if (config.gateway && config.gateway?.endsWith("/"))
        config.gateway = config.gateway.substring(0, config.gateway.length - 1)

    // Make sure that the Optimizely CMS Domain is adjusted correctly
    if (config.dxp_url &&  config.dxp_url != "" && !config.dxp_url.includes("://"))
        config.dxp_url = "https://"+config.dxp_url

    if (config.deploy_domain && config.deploy_domain != "" && config.deploy_domain.includes("://"))
        try {
            const nd = new URL(config.deploy_domain)
            config.deploy_domain = nd.host
        } catch {
            config.deploy_domain = config.deploy_domain.substring(config.deploy_domain.indexOf("://") + 3)
        }

    return config
}

export function applyConfigDefaults(configuredValues: Types.OptimizelyGraphConfig) : Types.OptimizelyGraphConfigInternal
{
    const defaults : Types.OptimizelyGraphConfigInternal = {
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
 * Validate the configuration
 * 
 * @param toValidate The configuration object
 * @param forPublishedOnly Whether to only validate for published content access
 * @returns 
 */
export function validateConfig(toValidate: Types.OptimizelyGraphConfig, forPublishedOnly: boolean = true, throwError: boolean = false) : toValidate is Types.OptimizelyGraphConfigInternal
{
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

function isNonEmptyString(toTest: any) : toTest is string
{
    return typeof(toTest) == 'string' && toTest.length > 0
}

function isValidUrl(toTest: any) : boolean 
{
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

function getBoolean(envVarName: string, defaultValue: boolean | (() => boolean) = false) : boolean
{
    const currentValue = getOptional(envVarName)
    if (!currentValue) {
        if (typeof(defaultValue) == 'function')
            return defaultValue()
        return defaultValue
    }
    return currentValue == '1' || currentValue.toLowerCase() == 'true'
}

function getMandatory(envVarName: string) : string
{
    let value : string | undefined = undefined
    try {
        value = process.env[envVarName]
    } catch (e) {
        // Ignore on purpose
    }
    if (value == null || value == undefined || value.trim() == "")
        throw new Error(`The environment variable ${ envVarName } is required, but not set`)

    return value.trim()
}

function getOptional(envVarName: string, defaultValue?: string | (() => string | undefined) | undefined) : string | undefined
{
    try {
        return getMandatory(envVarName)
    } catch (e) {
        if (typeof(defaultValue) == 'function')
            return defaultValue()
        return defaultValue
    }
}

function getSelection<T>(envVarName: string, allowedValues: T[], defaultValue: T) : T
{
    const rawValue = getOptional(envVarName, defaultValue as string)
    if (!rawValue)
        return defaultValue
    if (allowedValues.some(av => av == rawValue))
        return rawValue as T
    return defaultValue
}