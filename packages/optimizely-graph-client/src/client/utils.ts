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