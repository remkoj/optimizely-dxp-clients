import { type CmsIntegrationApiOptions, readEnvConfig } from "./config";

type TokenResponse = { access_token: string, expires_in: number, token_type: string }
type ErrorResponse = { error: string, error_description: string }
type AuthResponse = TokenResponse | ErrorResponse

function isErrorResponse(response: AuthResponse): response is ErrorResponse {
  return typeof ((response as ErrorResponse).error) == 'string'
}

export async function getAccessToken(config?: CmsIntegrationApiOptions, baseUrl?: string): Promise<string> {
  const options = config ?? readEnvConfig()
  const authUrl = new URL(`oauth/token`, baseUrl ?? options.base ?? 'https://api.cms.optimizely.com/').href
  const headers = new Headers()

  if (!options.clientId || !options.clientSecret) {
    if (options.debug)
      console.log(`❌ [CMS API] Skipping authentication due to missing clientId or clientSecret`);
    return '';
  }

  headers.append('Authorization', `Basic ${base64Encode(`${options.clientId ?? ''}:${options.clientSecret ?? ''}`)}`);
  headers.append('Content-Type', 'application/x-www-form-urlencoded');
  headers.append('Connection', 'close');

  if (options.debug) {
    console.log(`⚪ [CMS API] Using authentication endpoint: ${authUrl}`);
    console.log(`⚪ [CMS API] Retrieving new credentials for ${options.clientId ?? '-'}`);
  }

  const body = new URLSearchParams();
  body.append("grant_type", "client_credentials");

  const httpResponse = await fetch(authUrl, {
    method: "POST",
    headers: headers,
    body: body.toString(),
    cache: "no-store"
  });
  if (!httpResponse.ok) {
    console.error(`❌ [CMS API] Network error while authenticating: ${httpResponse.status} ${httpResponse.statusText}`);
    if (config?.debug) {
      console.group("Network request")
      console.log(`URL: ${authUrl}`)
      console.log(`Method: POST`)
      headers.entries().forEach(([ headerKey, headerValue ]) => {
        console.log(`Header ${ headerKey }: ${ headerValue }`);
      })
      console.log(body.toString())
      console.groupEnd()
      console.group("Network response")
      httpResponse.headers.entries().forEach(([ headerKey, headerValue ]) => {
        console.log(`Header ${ headerKey }: ${ headerValue }`);
      })
      console.log(await httpResponse.text())
      console.groupEnd()
    }
    throw new Error(`Network error ${httpResponse.status} ${httpResponse.statusText}`);
  }
  const response = await httpResponse.json() as AuthResponse;

  if (isErrorResponse(response))
    throw new Error("Authentication error: " + response.error_description)

  return response.access_token
}

function base64Encode(input: string): string {
  if (btoa && typeof (btoa) == 'function')
    return btoa(input)
  if (Buffer && typeof (Buffer) == 'object')
    //@ts-expect-error We're running in server context, so no need for errors here
    return Buffer.from(input).toString('base64')

  throw new Error("Unable to base64Encode")
}

export default getAccessToken
