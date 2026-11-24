import { readEnvironmentVariables, applyConfigDefaults, validateConfig, type OptimizelyGraphConfig, OptimizelyGraphConfigInternal } from '../config.js'
import { createHmacFetch } from '../hmac-fetch.js'
import { createClient as createHttpClient, createConfig, type Client } from './client/client/index.js'
import { ApiError, unwrap, BestBetsService, DefinitionV2Service, DefinitionV3Service, LogsService, OidcService, PinnedResultsService, QueryGraphQlService, ResourcesService, WebhooksService } from './services.js'
import type * as ClientTypes from './types.js'

export * from './types.js'
export type * from './client/types.gen.js'
export type * from './legacy-types.js'
export * from './services.js'

/**
 * Client for the Optimizely Graph Admin API. The requests are signed with the
 * App Key and Secret of the provided configuration.
 */
export class OptimizelyGraphAdminApi {
  protected readonly graphConfig : OptimizelyGraphConfigInternal
  /** The underlying HTTP client, which is dedicated to this instance */
  protected readonly httpClient : Client
  public readonly bestBets: BestBetsService
  public readonly definitionV2: DefinitionV2Service
  public readonly definitionV3: DefinitionV3Service
  public readonly logs: LogsService
  public readonly oidc: OidcService
  public readonly pinnedResults: PinnedResultsService
  public readonly queryGraphQl: QueryGraphQlService
  public readonly resources: ResourcesService
  public readonly webhooks: WebhooksService

  /**
   * @param   config    The Optimizely Graph config, will be read from the
   *                    environment when omitted
   */
  public constructor(config?: OptimizelyGraphConfig) {
    const graphConfig = applyConfigDefaults(config ?? readEnvironmentVariables())
    if (!validateConfig(graphConfig, true))
      throw new Error("The Optimizely Graph Admin API requires the App Key and Secret to be defined")
    this.graphConfig = graphConfig
    this.httpClient = createHttpClient(createConfig({
      baseUrl: graphConfig.gateway,
      credentials: 'include',
      headers: { "X-Client": "@RemkoJ/OptimizelyGraphClient" },
      ...(graphConfig.app_key && graphConfig.secret ? { fetch: createHmacFetch(graphConfig.app_key, graphConfig.secret) } : {})
    }))
    this.bestBets = new BestBetsService(this.httpClient)
    this.definitionV2 = new DefinitionV2Service(this.httpClient)
    this.definitionV3 = new DefinitionV3Service(this.httpClient)
    this.logs = new LogsService(this.httpClient)
    this.oidc = new OidcService(this.httpClient)
    this.pinnedResults = new PinnedResultsService(this.httpClient)
    this.queryGraphQl = new QueryGraphQlService(this.httpClient)
    this.resources = new ResourcesService(this.httpClient)
    this.webhooks = new WebhooksService(this.httpClient)
  }

  /**
     * Retrieve the journal contents from a Content Source post operation
     * 
     * @param       journalId       The journal identifier, typically something like 'stream/{guid}'
     * @returns     The journal contents
     */
  public getJournal(journalId: string) : Promise<ClientTypes.JournalResponse> {
    return unwrap<ClientTypes.JournalResponse>(this.httpClient.get<{ 200: ClientTypes.JournalResponse }, unknown>({
      url: `/journal/${journalId.split('/').map(encodeURIComponent).join('/')}`
    }))
  }

  /**
     * Convenience mehtod that chains the two needed service calls to get the
     * actual result from submitting content into Optimizely Graph.
     * 
     * @param   sourceId        The unique identifier of the content source
     * @param   contentItems    The data to be sent to Optimizely Graph in the required NDJson format
     * @returns The results of the operation
     */
  public postSourceContent(sourceId: string, contentItems: string) : Promise<ClientTypes.PostContentV2DataHandlerResponse>
  {
    return unwrap<ClientTypes.PostContentV2DataHandlerResponse>(this.httpClient.post<{ 200: ClientTypes.PostContentV2DataHandlerResponse }, unknown>({
      url: '/api/content/v2/data',
      query: { id: sourceId },
      body: contentItems,
      bodySerializer: null,
      headers: { 'Content-Type': 'application/x-ndjson' }
    }))
  }

  /**
     * Retrieve the OpenAPI Specification of the Optimizely Graph management
     * API, that is wrapped by this client. This will fetch the OpenAPI spec
     * from the service, so it might be ahead of the OpenAPI spec that was 
     * used to generate this client.
     * 
     * @returns     The OpenAPI spec
     */
  public getOpenApiSpec() : Promise<unknown>
  {
    return unwrap<unknown>(this.httpClient.get<{ 200: unknown }, unknown>({
      url: '/app/swagger/swagger.json'
    }))
  }
}

/**
 * Check if the provided value is an API Error, so that it can be handled as such
 * 
 * @param       error   The value to check
 * @returns     'true' when the value is an ApiError, 'false' otherwise
 */
export function isApiError(error: unknown) : error is ApiError
{
  if (typeof error != 'object' || error == null)
    return false
  return typeof (error as ApiError).status == 'number' && typeof (error as ApiError).url == 'string'
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