import { withOperations, ApiClient as AbstractApiClient, ApiError } from '@remkoj/hey-api-wrapper'
import { readEnvironmentVariables, applyConfigDefaults, validateConfig, type OptimizelyGraphConfig } from '../config.js'
import { createHmacFetch } from '@remkoj/hey-api-wrapper/hmac'
import { createClient as createHttpClient, createConfig } from './client/client/index.js'
import * as Operations from './client/sdk.gen.js'
import type * as ClientTypes from './types.js'

export * from './types.js'
export type * from './client/types.gen.js'
export { ApiError }

/** The name of this API in log output and error messages */
const API_NAME = 'Graph Admin API'

/**
 * Base implementation of the Optimizely Graph Admin API client: it owns the
 * configuration and the HMAC signing of the requests. The generated operations
 * (e.g. `listWebhookHandler`) are mixed in through `withOperations`, see
 * {@link OptimizelyGraphAdminApi}.
 */
class BaseAdminApi extends AbstractApiClient<{ debug: boolean, name: string }, ReturnType<typeof createHttpClient>> {
  /**
   * @param   config    The Optimizely Graph config, will be read from the
   *                    environment when omitted
   * @throws  When the App Key and Secret are not defined
   */
  public constructor(config?: OptimizelyGraphConfig) {
    const graphConfig = applyConfigDefaults(config ?? readEnvironmentVariables())
    if (!validateConfig(graphConfig, true))
      throw new Error("The Optimizely Graph Admin API requires the App Key and Secret to be defined")
    super({ debug: graphConfig.debug ?? false, name: API_NAME }, createHttpClient(createConfig({
      baseUrl: graphConfig.gateway,
      credentials: 'include',
      headers: { "X-Client": "@RemkoJ/OptimizelyGraphClient" },
      ...(graphConfig.app_key && graphConfig.secret ? { fetch: createHmacFetch(graphConfig.app_key, graphConfig.secret) } : {})
    })))
  }

  /**
     * Retrieve the journal contents from a Content Source post operation
     * 
     * @param       journalId       The journal identifier, typically something like 'stream/{guid}'
     * @returns     The journal contents
     * @throws      {ApiError} When the service returns an error response
     */
  public async getJournal(journalId: string) : Promise<ClientTypes.JournalResponse> {
    const result = await this._client.get<{ 200: ClientTypes.JournalResponse }, unknown>({
      url: `/journal/${journalId.split('/').map(encodeURIComponent).join('/')}`,
      throwOnError: false
    })
    if (result.error)
      throw this.createApiError(result)
    return result.data as ClientTypes.JournalResponse
  }

  /**
     * Convenience method to submit content into Optimizely Graph in the
     * NDJson format, which the generated operation can't send as-is.
     * 
     * @param   sourceId        The unique identifier of the content source
     * @param   contentItems    The data to be sent to Optimizely Graph in the required NDJson format
     * @returns The results of the operation
     * @throws  {ApiError} When the service returns an error response
     */
  public async postSourceContent(sourceId: string, contentItems: string) : Promise<ClientTypes.PostContentV2DataHandlerResponse>
  {
    const result = await this._client.post<{ 200: ClientTypes.PostContentV2DataHandlerResponse }, unknown>({
      url: '/api/content/v2/data',
      query: { id: sourceId },
      body: contentItems,
      bodySerializer: null,
      headers: { 'Content-Type': 'application/x-ndjson' },
      throwOnError: false
    })
    if (result.error)
      throw this.createApiError(result)
    return result.data as ClientTypes.PostContentV2DataHandlerResponse
  }

  /**
     * Retrieve the OpenAPI Specification of the Optimizely Graph management
     * API, that is wrapped by this client. This will fetch the OpenAPI spec
     * from the service, so it might be ahead of the OpenAPI spec that was 
     * used to generate this client.
     * 
     * @returns     The OpenAPI spec
     * @throws      {ApiError} When the service returns an error response
     */
  public async getOpenApiSpec() : Promise<unknown>
  {
    const result = await this._client.get<{ 200: unknown }, unknown>({
      url: '/app/swagger/swagger.json',
      throwOnError: false
    })
    if (result.error)
      throw this.createApiError(result)
    return result.data
  }
}

/**
 * Client for the Optimizely Graph Admin API, with one method per operation of
 * the Admin API (see `./client/sdk.gen`), e.g. `listWebhookHandler()` or
 * `deleteWebhookHandler({ path: { id } })`. The requests are signed with the
 * App Key and Secret of the provided configuration. Failed operations throw an
 * {@link ApiError}.
 */
export const OptimizelyGraphAdminApi = withOperations(BaseAdminApi, Operations)

/** An instance of {@link OptimizelyGraphAdminApi}, as returned by `createClient()`. */
export type OptimizelyGraphAdminApi = InstanceType<typeof OptimizelyGraphAdminApi>

/**
 * Check if the provided value is an API Error, so that it can be handled as such
 * 
 * @param       error   The value to check
 * @returns     'true' when the value is an ApiError, 'false' otherwise
 */
export function isApiError(error: unknown) : error is ApiError
{
  return error instanceof ApiError
}

/**
 * Create a new instance of the Optimizely Graph Admin API client
 * 
 * @param       config      The Optimizely Graph config, will be read from the
 *                          environment when omitted
 * @returns     The Admin API client
 */
export function createClient(config?: OptimizelyGraphConfig) : OptimizelyGraphAdminApi
{
  return new OptimizelyGraphAdminApi(config)
}

export default createClient