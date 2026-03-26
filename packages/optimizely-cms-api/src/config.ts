import { OpenAPI } from './client/core/OpenAPI'
import { OptiCmsVersion } from './types'

export type CmsIntegrationApiOptions = {
    base: URL
    clientId?: string
    clientSecret?: string
    actAs?: string
    debug?: boolean

    /**
     * The CMS Schema version that is used
     */
    cmsVersion?: OptiCmsVersion
}

/**
 * Extracts the API gateway URL from a CMS frontend URL.
 * Converts patterns like app-xyz.cmstest.optimizely.com → api.cmstest.optimizely.com
 * @param cmsUrl - The CMS frontend URL
 * @returns The API gateway URL, or null if not a recognized SaaS pattern
 */
function extractApiGateway(cmsUrl: string): string | null
{
    try {
        const urlObj = new URL(cmsUrl)
        const hostname = urlObj.hostname

        // Check if it's a SaaS CMS URL pattern: app[-tenant].cms[env].optimizely.com
        const saasMatch = hostname.match(/^app(-[^.]+)?\.cms([^.]*)?\.optimizely\.com$/)
        if (saasMatch) {
            // Extract only the environment suffix (not tenant)
            // e.g., 'test' from '.cmstest.' or '' from '.cms.'
            const env = saasMatch[2] || ''

            // Construct API gateway: api.cms[env].optimizely.com (no tenant in API URL)
            return `https://api.cms${env}.optimizely.com`
        }

        return null
    } catch {
        return null
    }
}

export function getCmsIntegrationApiConfigFromEnvironment() : CmsIntegrationApiOptions
{
    const cmsUrl = getOptional('OPTIMIZELY_CMS_URL', 'https://example.cms.optimizely.com')
    const cmsApiUrl = getOptional('OPTIMIZELY_CMS_API_URL')
    const clientId = getMandatory('OPTIMIZELY_CMS_CLIENT_ID')
    const clientSecret = getMandatory('OPTIMIZELY_CMS_CLIENT_SECRET')
    const actAs = getOptional('OPTIMIZELY_CMS_USER_ID')
    const debug = getOptional('OPTIMIZELY_DEBUG',"0") == "1"
    const cmsVersion = getSelection<OptiCmsVersion>('OPTIMIZELY_CMS_SCHEMA', [OptiCmsVersion.CMS12,OptiCmsVersion.CMS13], OptiCmsVersion.CMS13)

    let baseUrl : URL
    try {
        const cmsUrlAdjusted = cmsUrl.includes("://") ? cmsUrl : 'https://'+cmsUrl

        // Determine the API endpoint URL
        let apiEndpoint: string
        if (cmsApiUrl) {
            // User explicitly set the API URL
            apiEndpoint = cmsApiUrl.includes("://") ? cmsApiUrl : 'https://'+cmsApiUrl
        } else {
            // Try to auto-detect API gateway from CMS URL
            const detectedApiGateway = extractApiGateway(cmsUrlAdjusted)
            if (detectedApiGateway) {
                apiEndpoint = detectedApiGateway
            } else {
                // Custom domain or non-SaaS: use the CMS URL as-is
                apiEndpoint = cmsUrlAdjusted
            }
        }

        const apiPath = new URL(OpenAPI.BASE).pathname
        baseUrl = new URL(apiPath, apiEndpoint)
        if (cmsVersion == OptiCmsVersion.CMS12)
            baseUrl.pathname = baseUrl.pathname.replace('preview2', 'preview1')
    } catch (e) {
        throw new Error("Invalid Optimizely CMS URL provided")
    }

    if (debug) {
        console.log(`[Optimizely CMS API] CMS URL: ${ cmsUrl }`)
        console.log(`[Optimizely CMS API] API Endpoint: ${ baseUrl }`)
        console.log(`[Optimizely CMS API] Connecting to ${ baseUrl } as ${ clientId }`)
    }

    return {
        base: baseUrl,
        clientId,
        clientSecret,
        actAs,
        debug,
        cmsVersion
    }
}

function getOptional<DT extends string | undefined>(variable: string, defaultValue?: DT) : DT extends string ? string : string | undefined
{
    const envValue = process.env[variable]
    if (!envValue || envValue == "")
        return defaultValue as DT extends string ? string : undefined
    return envValue
}
function getMandatory(variable: string) : string
{
    const envValue = process.env[variable]
    if (!envValue)
        throw new Error(`The environment variable ${ variable } is missing or empty`)
    return envValue
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
