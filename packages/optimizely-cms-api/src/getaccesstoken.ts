import { type CmsIntegrationApiOptions, getCmsIntegrationApiConfigFromEnvironment } from "./config";

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