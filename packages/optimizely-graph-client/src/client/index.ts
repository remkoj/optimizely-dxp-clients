export { ContentGraphClient } from './client.js'
export { createHmacFetch } from '../hmac-fetch.js'
export { isContentGraphClient, isOptiGraphClient, isOptiGraphConfig } from './utils.js'
export { OptiCmsSchema, AuthMode, type IOptiGraphClient, type ClientFactory } from './types.js'


import type { OptimizelyGraphConfig } from '../types.js'
import { AuthMode, type IOptiGraphClient } from './types.js'
import { ContentGraphClient } from './client.js'

/**
 * Create a new instance of the default Optimizely Graph client
 * 
 * @param   config   The client configuration
 * @param   token    The authentication token to apply to the client
 * @returns The newly created instance
 */
export function createClient(config?: OptimizelyGraphConfig, token?: string | undefined): IOptiGraphClient
{
    return new ContentGraphClient(config, token)
}

export default createClient