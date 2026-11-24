import { OptimizelyGraphConfig } from "../types.js"
import { AuthMode, type IOptiGraphClient, type FrontendUser } from "./types.js"

const TOKEN_MIN_LENGTH = 16

/**
 * Test if the provided value is a valid FrontendUser object
 * 
 * @param       toTest      The value to test
 * @returns     `true` If toTest is a FrontendUser, `false` otherwise
 */
export function isValidFrontendUser(toTest?: any): toTest is FrontendUser {
  // FrontendUser is an object with exactly two properties
  if (typeof (toTest) != 'object' || toTest == null || Object.getOwnPropertyNames(toTest).length != 2)
    return false

  // FrontendUser has string property `username` and `roles`, each being non-empty
  return typeof (toTest?.username) == 'string' && toTest.username.length > 0 &&
    typeof (toTest?.roles) == 'string' && toTest.roles.length > 0
}

export function validateToken(newToken?: string): boolean {
  return newToken == undefined || newToken == AuthMode.HMAC || newToken == AuthMode.Basic || newToken.length > TOKEN_MIN_LENGTH
}

export function getAuthMode(token?: string): AuthMode {
  switch (token) {
    case AuthMode.HMAC:
      return AuthMode.HMAC
    case AuthMode.Basic:
      return AuthMode.Basic
    default:
      if (typeof (token) == 'string' && token.length > TOKEN_MIN_LENGTH)
        return AuthMode.Token
      return AuthMode.Public
  }
}

export function base64encode(binaryString: string) {
  if (Buffer)
    return Buffer.from(binaryString).toString('base64')
  return btoa(binaryString)
}

export function isError(toTest: any): toTest is Error {
  return typeof (toTest) == 'object' && toTest != null && typeof (toTest as Error).name == 'string' && typeof (toTest as Error).message == 'string'
}

/**
 * The response headers in which Optimizely Graph returns the id of a request,
 * in order of preference. The documentation of Optimizely uses both
 * `correlation-id` and `X-Request-ID`, so all are read until verified.
 */
export const REQUEST_ID_HEADERS: readonly string[] = ['correlation-id', 'x-request-id', 'x-correlation-id']

/**
 * Read the id of a request from the response headers of Optimizely Graph. This
 * only does a few header lookups, so it is cheap enough for every request.
 * 
 * @param       headers     The response headers
 * @returns     The request id, or `undefined` when the response has none
 */
export function extractRequestId(headers: { get(name: string): string | null } | null | undefined): string | undefined {
  if (!headers || typeof headers.get != 'function')
    return undefined
  for (let i = 0; i < REQUEST_ID_HEADERS.length; i++) {
    const value = headers.get(REQUEST_ID_HEADERS[i])
    if (value)
      return value
  }
  return undefined
}

/**
 * Mask a credential for logging: the scheme (if any) and the first four
 * characters are kept for recognition, values of 8 characters or less are
 * masked completely.
 * 
 * @param       value       The credential, e.g. a complete `Authorization` header value
 * @returns     The masked credential
 */
export function maskSecret(value: string): string {
  const separator = value.indexOf(' ')
  const scheme = separator > 0 ? value.substring(0, separator + 1) : ''
  const secret = value.substring(scheme.length)
  return scheme + (secret.length > 8 ? secret.substring(0, 4) : '') + '***'
}

const IDENTITY_HEADERS = ['cg-username', 'cg-roles']

/**
 * Create a loggable copy of request headers, in which the credentials 
 * (`Authorization`) and the frontend user identity (`cg-username`, `cg-roles`)
 * are masked. This allocates, so only use it when the output is actually logged.
 * 
 * @param       headers     The headers as plain object, `Headers` or list of name/value tuples
 * @returns     A new object with the masked headers
 */
export function maskHeaders(headers: Headers | Record<string, unknown> | Array<[string, string]> | HeadersInit | null | undefined): Record<string, string> {
  const result: Record<string, string> = {}
  if (!headers || typeof headers != 'object')
    return result
  const add = (name: string, value: unknown) => {
    const lowerName = name.toLowerCase()
    const text = String(value)
    result[name] = lowerName == 'authorization' ? maskSecret(text) : IDENTITY_HEADERS.includes(lowerName) ? '***' : text
  }
  if (Array.isArray(headers))
    headers.forEach(([name, value]) => add(name, value))
  else if (typeof (headers as Headers).forEach == 'function')
    (headers as Headers).forEach((value, name) => add(name, value))
  else
    Object.entries(headers).forEach(([name, value]) => add(name, value))
  return result
}

/**
 * 
 * @deprecated 
 * @see         `isOptiGraphClient()`
 * @param       client      The value to test
 * @returns     `true` when the value can be used as IOptiGraphClient, `false` if not
 */
export function isContentGraphClient(client: any): client is IOptiGraphClient {
  return isOptiGraphClient(client)
}

/**
 * Test if the provided GraphQL Client is an IOptiGraphClient instance and thus allows
 * the extended API of this interface to be used.
 * 
 * @param       client      The GraphQL Client to test
 * @returns     `true` when the value can be used as IOptiGraphClient, `false` if not
 */
export function isOptiGraphClient(client: any): client is IOptiGraphClient {
  if (typeof (client) != 'object' || client == null)
    return false
  return typeof (client as IOptiGraphClient).updateAuthentication == 'function'
    && typeof (client as IOptiGraphClient).request == 'function'
}

/**
 * Test if the provided Object can be understood to be an instance of the 
 * Optimizely Graph configuration
 * 
 * @param       client      The value to test
 * @returns     `true` when the value can be understood as a config object, `false` otherwise
 */
export function isOptiGraphConfig(client: any): client is OptimizelyGraphConfig {
  if (typeof (client) != 'object' || client == null)
    return false
  return typeof (client as OptimizelyGraphConfig).single_key == 'string' && (client as OptimizelyGraphConfig).single_key.length > 0
}