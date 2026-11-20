import { type CmsIntegrationApiOptions, getCmsIntegrationApiConfigFromEnvironment } from "./config";
import { OpenAPI } from "./client/core/OpenAPI"
import { OptiCmsVersion } from "./types";

type TokenResponse = { access_token: string, expires_in: number, token_type: string }
type ErrorResponse = { error: string, error_description: string }
type AuthResponse = TokenResponse | ErrorResponse

function isErrorResponse(response: AuthResponse) : response is ErrorResponse
{
    return typeof((response as ErrorResponse).error) == 'string'
}

function isManagedApiGateway(url: URL) : boolean
{
    return /^api\.cms[^.]*\.optimizely\.com$/i.test(url.hostname)
}

/**
 * Resolves the OAuth token endpoint. The managed API gateway serves it from the
 * host root (not below the versioned `/v1` API path), other hosts relative to
 * the configured API base.
 */
export function getAuthUrl(options: CmsIntegrationApiOptions) : string
{
    if (isManagedApiGateway(options.base))
        return new URL('/oauth/token', options.base).href
    const authUrl = new URL('oauth/token', options.base.href.replace(/\/*$/, '/')).href
    return options.cmsVersion === OptiCmsVersion.CMS12 ? authUrl.replace('preview2', 'preview1') : authUrl
}

export async function getAccessToken(config?: CmsIntegrationApiOptions) : Promise<string>
{
    const options = config ?? getCmsIntegrationApiConfigFromEnvironment()
    const authUrl = getAuthUrl(options)
    const headers = new Headers()

    headers.append('Authorization', `Basic ${ base64Encode(`${ options.clientId }:${ options.clientSecret }`)}`)
    headers.append('Content-Type','application/x-www-form-urlencoded')
    headers.append('Connection', 'close')

    if (options.debug) {
        console.log(`⚪ [CMS API] Using authentication endpoint: ${ authUrl }`)
        console.log(`⚪ [CMS API] Retrieving new credentials for ${ options.clientId }, acting as ${ options.actAs ?? options.clientId ?? '-' }`)
    }

    const body = new URLSearchParams()
    body.append("grant_type", "client_credentials")
    if (options.actAs)
        body.append("act_as", options.actAs)

    const httpResponse = await fetch(authUrl, {
        method: "POST",
        headers: headers,
        body: body.toString(),
        cache: "no-store"
    })
    const response = await httpResponse.json().catch(() => ({})) as AuthResponse
    
    if (isErrorResponse(response))
        throw new Error("Authentication error: " + response.error_description)
    if (!httpResponse.ok || typeof response.access_token != 'string' || response.access_token == '')
        throw new Error(`Authentication error: no access token received from ${ authUrl } (HTTP ${ httpResponse.status })`)

    return response.access_token
}

function base64Encode(input: string): string
{
    if (btoa && typeof(btoa) == 'function')
        return btoa(input)
    if (Buffer && typeof(Buffer) == 'object')
        //@ts-expect-error
        return Buffer.from(input).toString('base64')

    throw new Error("Unable to base64Encode")
}

export default getAccessToken
