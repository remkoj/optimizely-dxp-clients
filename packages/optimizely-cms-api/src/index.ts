export * from './config'
export * as IntegrationApi from './client'
export { CmsIntegrationApiClient } from './client'

import { type CmsIntegrationApiOptions, getCmsIntegrationApiConfigFromEnvironment } from './config'
import { CmsIntegrationApiClient } from './client'

type TokenResponse = { access_token: string, expires_in: number, token_type: string }
type ErrorResponse = { error: string, error_description: string }
type AuthResponse = TokenResponse | ErrorResponse

function isErrorResponse(response: AuthResponse) : response is ErrorResponse
{
    return typeof((response as ErrorResponse).error) == 'string'
}

let _access_token : Promise<string> | undefined = undefined

export async function getAccessToken(config?: CmsIntegrationApiOptions) : Promise<string>
{
    if (!_access_token) {
        _access_token = (async (config?: CmsIntegrationApiOptions) => {
            const options = config ?? getCmsIntegrationApiConfigFromEnvironment()
            const authUrl = `${options.base.href}/oauth/token`
            const headers = new Headers()
            headers.append('Authorization', `Basic ${ base64Encode(`${ options.clientId }:${ options.clientSecret }`)}`)
            headers.append('Content-Type','application/x-www-form-urlencoded')
            headers.append('Connection', 'close')

            const body = new URLSearchParams()
            body.append("grant_type", "client_credentials")
            if (options.actAs)
                body.append("act_as", options.actAs)

            const response = await (await fetch(authUrl, {
                method: "POST",
                headers: headers,
                body: body.toString()
            })).json() as AuthResponse
            
            if (isErrorResponse(response))
                throw new Error("Authentication error: " + response.error_description)

            return response.access_token
        })(config)
    }
    return _access_token
}

export function createClient(config?: CmsIntegrationApiOptions) : CmsIntegrationApiClient
{
    const options = config ?? getCmsIntegrationApiConfigFromEnvironment()
    const client = new CmsIntegrationApiClient({ 
        BASE: options.base.href, 
        TOKEN: () => getAccessToken(options),
        HEADERS: {
            Connection: "Close"
        }
    })
    return client
}

export enum ContentRoots {
    SystemRoot = "43f936c99b234ea397b261c538ad07c9",
    MultiChannelContent = "41118A415C8C4BE08E73520FF3DE8244"
}

export enum ContentTypeKeys {
    Folder = "SysContentFolder"
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

export default createClient