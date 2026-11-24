import * as sdk from './client/sdk.gen.js'
import type { Client } from './client/client/index.js'
import type * as Gen from './client/types.gen.js'

/**
 * Error that is thrown when the Optimizely Graph Admin API returns a non-success
 * response.
 */
export class ApiError extends Error {
  /** The URL that was requested */
  public readonly url: string
  /** The HTTP status code of the response */
  public readonly status: number
  /** The HTTP status text of the response */
  public readonly statusText: string
  /** The parsed (JSON) or raw (text) body of the response */
  public readonly body: any
  /** The request that resulted in this error */
  public readonly request: { method: string, url: string }

  /**
   * @param   request   The request that failed
   * @param   response  The response that was received
   * @param   message   The error message
   */
  constructor(request: { method: string, url: string }, response: { url: string, status: number, statusText: string, body: unknown }, message: string) {
    super(message)
    this.name = 'ApiError'
    this.url = response.url
    this.status = response.status
    this.statusText = response.statusText
    this.body = response.body
    this.request = request
  }
}

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable'
}

type SdkResult<T> = Promise<{ data?: T, error?: unknown, request?: Request, response?: Response }>

/**
 * Convert the result of a generated SDK call into a value or a rejection.
 *
 * @param     result    The result of the SDK call
 * @returns   The data of the response, `undefined` for an empty response
 * @throws    ApiError when the service responds with an error status, or the
 *            original error when no response was received
 */
export async function unwrap<T>(result: SdkResult<T>): Promise<T> {
  const { data, error, request, response } = await result
  if (!response) {
    throw error instanceof Error ? error : new Error('The Optimizely Graph Admin API request failed', { cause: error })
  }
  if (!response.ok) {
    const body = typeof error == 'object' || typeof error == 'string' ? error : undefined
    const message = ERROR_MESSAGES[response.status] ?? `Generic Error: status: ${response.status}; status text: ${response.statusText}; body: ${safeStringify(body)}`
    const requestInfo = { method: request?.method ?? 'GET', url: request?.url ?? response.url }
    throw new ApiError(requestInfo, { url: response.url || requestInfo.url, status: response.status, statusText: response.statusText, body }, message)
  }
  return (response.status == 204 ? undefined : data) as T
}

function safeStringify(value: unknown): string | undefined {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return undefined
  }
}

type Query<D> = D extends { query?: infer Q } ? NonNullable<Q> : never
type Body<D> = D extends { body?: infer B } ? NonNullable<B> : never

/** Text bodies are sent as is, anything else is serialized to JSON */
function toText(body: unknown): string {
  return typeof body == 'string' ? body : JSON.stringify(body)
}

/** Base class of the services, which hold the client instance to use */
abstract class Service {
  constructor(protected readonly client: Client) { }
}

/** Service to manage best bet collections */
export class BestBetsService extends Service {
  /**
   * Get bestbet collection(s)
   *
   * @param   id   Value for `id` of the `getBestBetCollectionHandler` operation
   * @param   page   Value for `page` of the `getBestBetCollectionHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  getBestBetCollectionHandler(id?: Query<Gen.GetBestBetCollectionHandlerData>['id'], page?: Query<Gen.GetBestBetCollectionHandlerData>['page']) {
    return unwrap<Gen.GetBestBetCollectionHandlerResponse>(sdk.getBestBetCollectionHandler({ client: this.client, query: { id, page } }))
  }
  /**
   * Register a bestbet collection
   *
   * @param   body   Value for `body` of the `createBestBetCollectionHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  createBestBetCollectionHandler(body: Body<Gen.CreateBestBetCollectionHandlerData>) {
    return unwrap<Gen.CreateBestBetCollectionHandlerResponse>(sdk.createBestBetCollectionHandler({ client: this.client, body }))
  }
  /**
   * Update a bestbet collection
   *
   * @param   id   Value for `id` of the `updateBestBetCollectionHandler` operation
   * @param   body   Value for `body` of the `updateBestBetCollectionHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  updateBestBetCollectionHandler(id: string, body: Body<Gen.UpdateBestBetCollectionHandlerData>) {
    return unwrap<Gen.UpdateBestBetCollectionHandlerResponse>(sdk.updateBestBetCollectionHandler({ client: this.client, path: { id }, body }))
  }
  /**
   * Delete a bestbet collection
   *
   * @param   id   Value for `id` of the `deleteBestBetCollectionHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  deleteBestBetCollectionHandler(id: string) {
    return unwrap<Gen.DeleteBestBetCollectionHandlerResponse>(sdk.deleteBestBetCollectionHandler({ client: this.client, path: { id } }))
  }
}

/** Service to manage content (v2) */
export class DefinitionV2Service extends Service {
  /**
   * Sync content data
   *
   * @param   id   Value for `id` of the `postContentV2DataHandler` operation
   * @param   body   Value for `body` of the `postContentV2DataHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  postContentV2DataHandler(id: string, body: string) {
    return unwrap<Gen.PostContentV2DataHandlerResponses[200]>(sdk.postContentV2DataHandler({ client: this.client, query: { id }, body }))
  }
  /**
   * Purge content data
   *
   * @param   id   Value for `id` of the `deleteContentV2DataHandler` operation
   * @param   languages   Value for `languages` of the `deleteContentV2DataHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  deleteContentV2DataHandler(id?: Query<Gen.DeleteContentV2DataHandlerData>['id'], languages?: Query<Gen.DeleteContentV2DataHandlerData>['languages']) {
    return unwrap<Gen.DeleteContentV2DataHandlerResponse>(sdk.deleteContentV2DataHandler({ client: this.client, query: { id, languages } as Query<Gen.DeleteContentV2DataHandlerData> }))
  }
  /**
   * Sync content types
   *
   * @param   body   Value for `body` of the `postContentV2TypeHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  postContentV2TypeHandler(body: Body<Gen.PostContentV2TypeHandlerData>) {
    return unwrap<Gen.PostContentV2TypeHandlerResponses[200]>(sdk.postContentV2TypeHandler({ client: this.client, body }))
  }
}

/** Service to manage content (v3) */
export class DefinitionV3Service extends Service {
  /**
   * Get source metadata
   *
   * @param   id   Value for `id` of the `getContentV3SourceHandler` operation
   * @param   slot   Value for `slot` of the `getContentV3SourceHandler` operation
   * @param   count   Value for `count` of the `getContentV3SourceHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  getContentV3SourceHandler(id?: Query<Gen.GetContentV3SourceHandlerData>['id'], slot?: Query<Gen.GetContentV3SourceHandlerData>['slot'], count?: Query<Gen.GetContentV3SourceHandlerData>['count']) {
    return unwrap<Gen.GetContentV3SourceHandlerResponse>(sdk.getContentV3SourceHandler({ client: this.client, query: { id, slot, count } }))
  }
  /**
   * Delete source
   *
   * @param   id   Value for `id` of the `deleteContentV3SourceHandler` operation
   * @param   mode   Value for `mode` of the `deleteContentV3SourceHandler` operation
   * @param   slot   Value for `slot` of the `deleteContentV3SourceHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  deleteContentV3SourceHandler(id?: Query<Gen.DeleteContentV3SourceHandlerData>['id'], mode?: Query<Gen.DeleteContentV3SourceHandlerData>['mode'], slot?: Query<Gen.DeleteContentV3SourceHandlerData>['slot']) {
    return unwrap<Gen.DeleteContentV3SourceHandlerResponses[200]>(sdk.deleteContentV3SourceHandler({ client: this.client, query: { id, mode, slot } }))
  }
  /**
   * Update source metadata
   *
   * @param   id   Value for `id` of the `postContentV3SourceHandler` operation
   * @param   body   Value for `body` of the `postContentV3SourceHandler` operation
   * @param   slot   Value for `slot` of the `postContentV3SourceHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  postContentV3SourceHandler(id: string, body: Body<Gen.PostContentV3SourceHandlerData>, slot?: Query<Gen.PostContentV3SourceHandlerData>['slot']) {
    return unwrap<Gen.PostContentV3SourceHandlerResponse>(sdk.postContentV3SourceHandler({ client: this.client, query: { id, slot }, body }))
  }
  /**
   * Get content types
   *
   * @param   id   Value for `id` of the `getContentV3TypeHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  getContentV3TypeHandler(id: string = 'default') {
    return unwrap<Gen.GetContentV3TypeHandlerResponse>(sdk.getContentV3TypeHandler({ client: this.client, query: { id } }))
  }
  /**
   * Partial content type update
   *
   * @param   body   Value for `body` of the `postContentV3TypeHandler` operation
   * @param   id   Value for `id` of the `postContentV3TypeHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  postContentV3TypeHandler(body: Body<Gen.PostContentV3TypeHandlerData>, id: string = 'default') {
    return unwrap<Gen.PostContentV3TypeHandlerResponse>(sdk.postContentV3TypeHandler({ client: this.client, query: { id }, body }))
  }
  /**
   * Full content type update
   *
   * @param   body   Value for `body` of the `putContentV3TypeHandler` operation
   * @param   id   Value for `id` of the `putContentV3TypeHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  putContentV3TypeHandler(body: Body<Gen.PutContentV3TypeHandlerData>, id: string = 'default') {
    return unwrap<Gen.PutContentV3TypeHandlerResponse>(sdk.putContentV3TypeHandler({ client: this.client, query: { id }, body }))
  }
}

/** Service to read the request logs */
export class LogsService extends Service {
  /**
   * Get request logs
   *
   * @param   page   Value for `page` of the `getRequestLogHandler` operation
   * @param   requestId   Value for `requestId` of the `getRequestLogHandler` operation
   * @param   host   Value for `host` of the `getRequestLogHandler` operation
   * @param   path   Value for `path` of the `getRequestLogHandler` operation
   * @param   success   Value for `success` of the `getRequestLogHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  getRequestLogHandler(page?: Query<Gen.GetRequestLogHandlerData>['page'], requestId?: Query<Gen.GetRequestLogHandlerData>['requestId'], host?: Query<Gen.GetRequestLogHandlerData>['host'], path?: Query<Gen.GetRequestLogHandlerData>['path'], success?: Query<Gen.GetRequestLogHandlerData>['success']) {
    return unwrap<Gen.GetRequestLogHandlerResponse>(sdk.getRequestLogHandler({ client: this.client, query: { page, requestId, host, path, success } }))
  }
}

/** Service to manage the OIDC configuration */
export class OidcService extends Service {
  /**
   * Upsert OIDC config
   *
   * @param   body   Value for `body` of the `upsertOidcConfigHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  upsertOidcConfigHandler(body: Body<Gen.UpsertOidcConfigHandlerData>) {
    return unwrap<Gen.UpsertOidcConfigHandlerResponse>(sdk.upsertOidcConfigHandler({ client: this.client, body }))
  }
  /**
   * Delete OIDC config
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  deleteOidcConfigHandler() {
    return unwrap<Gen.DeleteOidcConfigHandlerResponse>(sdk.deleteOidcConfigHandler({ client: this.client }))
  }
}

/** Service to manage pinned results */
export class PinnedResultsService extends Service {
  /**
   * Get pinned collection(s)
   *
   * @param   page   Value for `page` of the `listPinnedCollectionHandler` operation
   * @param   sort   Value for `sort` of the `listPinnedCollectionHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  listPinnedCollectionHandler(page?: Query<Gen.ListPinnedCollectionHandlerData>['page'], sort?: Query<Gen.ListPinnedCollectionHandlerData>['sort']) {
    return unwrap<Gen.ListPinnedCollectionHandlerResponse>(sdk.listPinnedCollectionHandler({ client: this.client, query: { page, sort } }))
  }
  /**
   * Register a pinned collection
   *
   * @param   body   Value for `body` of the `createPinnedCollectionHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  createPinnedCollectionHandler(body: Body<Gen.CreatePinnedCollectionHandlerData>) {
    return unwrap<Gen.CreatePinnedCollectionHandlerResponse>(sdk.createPinnedCollectionHandler({ client: this.client, body }))
  }
  /**
   * Get pinned collection by Id
   *
   * @param   collectionId   Value for `collectionId` of the `getPinnedCollectionHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  getPinnedCollectionHandler(collectionId: string) {
    return unwrap<Gen.GetPinnedCollectionHandlerResponse>(sdk.getPinnedCollectionHandler({ client: this.client, path: { collectionId } }))
  }
  /**
   * Update a pinned collection
   *
   * @param   collectionId   Value for `collectionId` of the `updatePinnedCollectionHandler` operation
   * @param   body   Value for `body` of the `updatePinnedCollectionHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  updatePinnedCollectionHandler(collectionId: string, body: Body<Gen.UpdatePinnedCollectionHandlerData>) {
    return unwrap<Gen.UpdatePinnedCollectionHandlerResponse>(sdk.updatePinnedCollectionHandler({ client: this.client, path: { collectionId }, body }))
  }
  /**
   * Delete a pinned collection
   *
   * @param   collectionId   Value for `collectionId` of the `deletePinnedCollectionHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  deletePinnedCollectionHandler(collectionId: string) {
    return unwrap<Gen.DeletePinnedCollectionHandlerResponse>(sdk.deletePinnedCollectionHandler({ client: this.client, path: { collectionId } }))
  }
  /**
   * Get list of pinned items by collection id
   *
   * @param   collectionId   Value for `collectionId` of the `listPinnedItemHandler` operation
   * @param   limit   Value for `limit` of the `listPinnedItemHandler` operation
   * @param   offset   Value for `offset` of the `listPinnedItemHandler` operation
   * @param   phrase   Value for `phrase` of the `listPinnedItemHandler` operation
   * @param   sort   Value for `sort` of the `listPinnedItemHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  listPinnedItemHandler(collectionId: string, limit?: Query<Gen.ListPinnedItemHandlerData>['limit'], offset?: Query<Gen.ListPinnedItemHandlerData>['offset'], phrase?: Query<Gen.ListPinnedItemHandlerData>['phrase'], sort?: Query<Gen.ListPinnedItemHandlerData>['sort']) {
    return unwrap<Gen.ListPinnedItemHandlerResponse>(sdk.listPinnedItemHandler({ client: this.client, path: { collectionId }, query: { limit, offset, phrase, sort } }))
  }
  /**
   * Create a new pinned item
   *
   * @param   collectionId   Value for `collectionId` of the `createPinnedItemHandler` operation
   * @param   body   Value for `body` of the `createPinnedItemHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  createPinnedItemHandler(collectionId: string, body: Body<Gen.CreatePinnedItemHandlerData>) {
    return unwrap<Gen.CreatePinnedItemHandlerResponse>(sdk.createPinnedItemHandler({ client: this.client, path: { collectionId }, body }))
  }
  /**
   * Clear pinned items in collection
   *
   * @param   collectionId   Value for `collectionId` of the `clearPinnedItemHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  clearPinnedItemHandler(collectionId: string) {
    return unwrap<Gen.ClearPinnedItemHandlerResponse>(sdk.clearPinnedItemHandler({ client: this.client, path: { collectionId } }))
  }
  /**
   * Get pinned item by id
   *
   * @param   collectionId   Value for `collectionId` of the `getPinnedItemHandler` operation
   * @param   id   Value for `id` of the `getPinnedItemHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  getPinnedItemHandler(collectionId: string, id: string) {
    return unwrap<Gen.GetPinnedItemHandlerResponse>(sdk.getPinnedItemHandler({ client: this.client, path: { collectionId, id } }))
  }
  /**
   * Update a pinned item
   *
   * @param   collectionId   Value for `collectionId` of the `updatePinnedItemHandler` operation
   * @param   id   Value for `id` of the `updatePinnedItemHandler` operation
   * @param   body   Value for `body` of the `updatePinnedItemHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  updatePinnedItemHandler(collectionId: string, id: string, body: Body<Gen.UpdatePinnedItemHandlerData>) {
    return unwrap<Gen.UpdatePinnedItemHandlerResponse>(sdk.updatePinnedItemHandler({ client: this.client, path: { collectionId, id }, body }))
  }
  /**
   * Remove pinned item
   *
   * @param   collectionId   Value for `collectionId` of the `deletePinnedItemHandler` operation
   * @param   id   Value for `id` of the `deletePinnedItemHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  deletePinnedItemHandler(collectionId: string, id: string) {
    return unwrap<Gen.DeletePinnedItemHandlerResponse>(sdk.deletePinnedItemHandler({ client: this.client, path: { collectionId, id } }))
  }
  /**
   * Get pinned results
   *
   * @param   body   Value for `body` of the `matchPinnedItemHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  matchPinnedItemHandler(body: Body<Gen.MatchPinnedItemHandlerData>) {
    return unwrap<Gen.MatchPinnedItemHandlerResponse>(sdk.matchPinnedItemHandler({ client: this.client, body }))
  }
}

/** Service to execute GraphQL queries */
export class QueryGraphQlService extends Service {
  /**
   * Execute graphql query
   *
   * @param   query   Value for `query` of the `getGraphQlv2Handler` operation
   * @param   mutation   Value for `mutation` of the `getGraphQlv2Handler` operation
   * @param   operationName   Value for `operationName` of the `getGraphQlv2Handler` operation
   * @param   variables   Value for `variables` of the `getGraphQlv2Handler` operation
   * @param   sources   Value for `sources` of the `getGraphQlv2Handler` operation
   * @param   lite   Value for `lite` of the `getGraphQlv2Handler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  getGraphQlv2Handler(query?: Query<Gen.GetGraphQlv2HandlerData>['query'], mutation?: Query<Gen.GetGraphQlv2HandlerData> extends { mutation?: infer M } ? M : never, operationName?: Query<Gen.GetGraphQlv2HandlerData>['operationName'], variables?: Query<Gen.GetGraphQlv2HandlerData>['variables'], sources?: Query<Gen.GetGraphQlv2HandlerData>['sources'], lite?: Query<Gen.GetGraphQlv2HandlerData>['lite']) {
    return unwrap<Gen.GetGraphQlv2HandlerResponse>(sdk.getGraphQlv2Handler({ client: this.client, query: { query, mutation, operationName, variables, sources, lite } as Query<Gen.GetGraphQlv2HandlerData> }))
  }
  /**
   * Execute graphql query
   *
   * @param   sources   Value for `sources` of the `postGraphQlv2Handler` operation
   * @param   lite   Value for `lite` of the `postGraphQlv2Handler` operation
   * @param   body   Value for `body` of the `postGraphQlv2Handler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  postGraphQlv2Handler(sources?: Query<Gen.PostGraphQlv2HandlerData>['sources'], lite?: Query<Gen.PostGraphQlv2HandlerData>['lite'], body?: Body<Gen.PostGraphQlv2HandlerData>) {
    return unwrap<Gen.PostGraphQlv2HandlerResponse>(sdk.postGraphQlv2Handler({ client: this.client, query: { sources, lite }, body }))
  }
}

/** Service to manage stopwords and synonyms */
export class ResourcesService extends Service {
  /**
   * Store stop words
   *
   * @param   body   Value for `body` of the `upsertStopwordHandler` operation
   * @param   languageRouting   Value for `languageRouting` of the `upsertStopwordHandler` operation
   * @param   sourceRouting   Value for `sourceRouting` of the `upsertStopwordHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  upsertStopwordHandler(body: Gen.StopwordsBody | string, languageRouting?: string, sourceRouting?: string) {
    return unwrap<Gen.UpsertStopwordHandlerResponse>(sdk.upsertStopwordHandler({ client: this.client, query: { language_routing: languageRouting, source_routing: sourceRouting }, body: toText(body) }))
  }
  /**
   * Delete stop words
   *
   * @param   languageRouting   Value for `languageRouting` of the `deleteStopwordHandler` operation
   * @param   sourceRouting   Value for `sourceRouting` of the `deleteStopwordHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  deleteStopwordHandler(languageRouting?: string, sourceRouting?: string) {
    return unwrap<Gen.DeleteStopwordHandlerResponse>(sdk.deleteStopwordHandler({ client: this.client, query: { language_routing: languageRouting, source_routing: sourceRouting } }))
  }
  /**
   * List synonyms
   *
   * @param   languageRouting   Value for `languageRouting` of the `listSynonymHandler` operation
   * @param   sourceRouting   Value for `sourceRouting` of the `listSynonymHandler` operation
   * @param   synonymSlot   Value for `synonymSlot` of the `listSynonymHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  listSynonymHandler(languageRouting?: string, sourceRouting?: string, synonymSlot: 'one' | 'two' = 'one') {
    return unwrap<Gen.ListSynonymHandlerResponse>(sdk.listSynonymHandler({ client: this.client, query: { language_routing: languageRouting, source_routing: sourceRouting, synonym_slot: synonymSlot } }))
  }
  /**
   * Store synonyms
   *
   * @param   body   Value for `body` of the `upsertSynonymHandler` operation
   * @param   languageRouting   Value for `languageRouting` of the `upsertSynonymHandler` operation
   * @param   sourceRouting   Value for `sourceRouting` of the `upsertSynonymHandler` operation
   * @param   synonymSlot   Value for `synonymSlot` of the `upsertSynonymHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  upsertSynonymHandler(body: Gen.SynonymsBody | string, languageRouting?: string, sourceRouting?: string, synonymSlot: 'one' | 'two' = 'one') {
    return unwrap<Gen.UpsertSynonymHandlerResponse>(sdk.upsertSynonymHandler({ client: this.client, query: { language_routing: languageRouting, source_routing: sourceRouting, synonym_slot: synonymSlot }, body: toText(body) }))
  }
  /**
   * Delete synonyms
   *
   * @param   languageRouting   Value for `languageRouting` of the `deleteSynonymHandler` operation
   * @param   sourceRouting   Value for `sourceRouting` of the `deleteSynonymHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  deleteSynonymHandler(languageRouting?: string, sourceRouting?: string) {
    return unwrap<Gen.DeleteSynonymHandlerResponse>(sdk.deleteSynonymHandler({ client: this.client, query: { language_routing: languageRouting, source_routing: sourceRouting } }))
  }
}

/** Service to manage the webhooks that are triggered by content changes */
export class WebhooksService extends Service {
  /**
   * List webhooks
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  listWebhookHandler() {
    return unwrap<Gen.ListWebhookHandlerResponse>(sdk.listWebhookHandler({ client: this.client }))
  }
  /**
   * Add webhook
   *
   * @param   body   Value for `body` of the `createWebhookHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  createWebhookHandler(body: Gen.WebhookPayload) {
    return unwrap<Gen.CreateWebhookHandlerResponse>(sdk.createWebhookHandler({ client: this.client, body }))
  }
  /**
   * Delete webhook
   *
   * @param   id   Value for `id` of the `deleteWebhookHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  deleteWebhookHandler(id: string) {
    return unwrap<Gen.DeleteWebhookHandlerResponse>(sdk.deleteWebhookHandler({ client: this.client, path: { id } }))
  }
  /**
   * Update webhook
   *
   * @param   id   Value for `id` of the `updateWebhookHandler` operation
   * @param   body   Value for `body` of the `updateWebhookHandler` operation
   * @returns   The response data of the operation, `undefined` for an empty response
   * @throws    ApiError when the service responds with an error status
   */
  updateWebhookHandler(id: string, body: Gen.WebhookPayload) {
    return unwrap<Gen.UpdateWebhookHandlerResponse>(sdk.updateWebhookHandler({ client: this.client, path: { id }, body }))
  }
}
