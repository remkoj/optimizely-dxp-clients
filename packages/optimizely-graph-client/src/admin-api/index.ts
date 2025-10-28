import { readEnvironmentVariables, applyConfigDefaults, validateConfig, type OptimizelyGraphConfig, OptimizelyGraphConfigInternal } from '../config.js'
import { OptimizelyGraphAdminApi as BaseOptimizelyGraphAdminApi, type ApiError, type CancelablePromise, type OpenAPIConfig } from './client/index.js'
import OptiHttpRequest, { isOptiHttpRequest } from './request/index.js'
import type * as ClientTypes from './types.js'

export * from './types.js'
export * from './client/index.js'

export class OptimizelyGraphAdminApi extends BaseOptimizelyGraphAdminApi {
    protected readonly graphConfig : OptimizelyGraphConfigInternal

    public constructor(config?: OptimizelyGraphConfig) {
        const graphConfig = applyConfigDefaults(config ?? readEnvironmentVariables())
        if (!validateConfig(graphConfig, true))
            throw new Error("The Optimizely Graph Admin API requires the App Key and Secret to be defined")
        const apiConfig : Partial<OpenAPIConfig> = {
            BASE: graphConfig.gateway,
            CREDENTIALS: "include",
            HEADERS: {
                "X-Client": "@RemkoJ/OptimizelyGraphClient",
            }
        }
        super(apiConfig, OptiHttpRequest)
        if (isOptiHttpRequest(this.request))
            this.request.setOptiGraphConfig(graphConfig)
        this.graphConfig = graphConfig
    }
    /**
     * Retrieve the journal contents from a Content Source post operation
     * 
     * @param       journalId       The journal identifier, typically something like 'stream/{guid}'
     * @returns     The journal contents
     */
    public getJournal(journalId: string) : CancelablePromise<ClientTypes.JournalResponse> {
        return this.request.request<ClientTypes.JournalResponse>({
            method: "GET",
            url: "/journal/{journalId}",
            path: {
                'journalId': journalId,
            }
        })
    }

    /**
     * Convenience mehtod that chains the two needed service calls to get the
     * actual result from submitting content into Optimizely Graph.
     * 
     * @param   sourceId        The unique identifier of the content source
     * @param   contentItems    The data to be sent to Optimizely Graph in the required NDJson format
     * @returns The results of the operation
     */
    public postSourceContent(sourceId: string, contentItems: string) : CancelablePromise<ClientTypes.PostContentV2DataHandlerResponse>
    {
        return this.request.request<ClientTypes.PostContentV2DataHandlerResponse>({
            method: 'POST',
            url: '/api/content/v2/data',
            query: {
                'id': sourceId,
            },
            body: contentItems,
            mediaType: 'application/x-ndjson',
        });
    }

    /**
     * Retrieve the OpenAPI Specification of the Optimizely Graph management
     * API, that is wrapped by this client. This will fetch the OpenAPI spec
     * from the service, so it might be ahead of the OpenAPI spec that was 
     * used to generate this client.
     * 
     * @returns     The OpenAPI spec
     */
    public getOpenApiSpec() : CancelablePromise<any>
    {
        return this.request.request({
            method: 'GET',
            url: '/app/swagger/swagger.json'
        })
    }
}

/**
 * Check if the provided value is an API Error, so that it can be handled as such
 * 
 * @param       error   The value to check
 * @returns     'true' when the value is an ApiError, 'false' otherwise
 */
export function isApiError(error: any) : error is ApiError
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