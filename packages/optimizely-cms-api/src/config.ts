export type CmsIntegrationApiOptions = {
    base: URL
    clientId?: string
    clientSecret?: string
    actAs?: string
}

export const API_VERSION = 'v0.5'

export function getCmsIntegrationApiConfigFromEnvironment() : CmsIntegrationApiOptions
{
    const cmsUrl = getMandatory('OPTIMIZELY_CMS_URL')
    const clientId = getMandatory('OPTIMIZELY_CMS_CLIENT_ID')
    const clientSecret = getMandatory('OPTIMIZELY_CMS_CLIENT_SECRET')
    const actAs = getOptional('OPTIMIZELY_CMS_USER_ID')

    let baseUrl : URL
    try {
        baseUrl = new URL('/_cms/'+API_VERSION, cmsUrl)
    } catch {
        throw new Error("Invalid URL provided")
    }

    return {
        base: baseUrl,
        clientId,
        clientSecret,
        actAs
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