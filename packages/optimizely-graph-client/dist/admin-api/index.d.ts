import { type OptimizelyGraphConfig, OptimizelyGraphConfigInternal } from '../config.js';
import { OptimizelyGraphAdminApi as BaseOptimizelyGraphAdminApi, type ApiError, type CancelablePromise } from './client/index.js';
import type * as ClientTypes from './types.js';
export * from './types.js';
export * from './client/index.js';
export declare class OptimizelyGraphAdminApi extends BaseOptimizelyGraphAdminApi {
    protected readonly graphConfig: OptimizelyGraphConfigInternal;
    constructor(config?: OptimizelyGraphConfig);
    /**
     * Retrieve the journal contents from a Content Source post operation
     *
     * @param       journalId       The journal identifier, typically something like 'stream/{guid}'
     * @returns     The journal contents
     */
    getJournal(journalId: string): CancelablePromise<ClientTypes.JournalResponse>;
    /**
     * Convenience mehtod that chains the two needed service calls to get the
     * actual result from submitting content into Optimizely Graph.
     *
     * @param   sourceId        The unique identifier of the content source
     * @param   contentItems    The data to be sent to Optimizely Graph in the required NDJson format
     * @returns The results of the operation
     */
    postSourceContent(sourceId: string, contentItems: string): CancelablePromise<ClientTypes.PostContentV2DataHandlerResponse>;
}
/**
 * Check if the provided value is an API Error, so that it can be handled as such
 *
 * @param       error   The value to check
 * @returns     'true' when the value is an ApiError, 'false' otherwise
 */
export declare function isApiError(error: any): error is ApiError;
/**
 * Create a new instance of the Optimizely Graph Admin API client
 *
 * @param       config      The Optimizely Graph config, will be read from the
 *                          environment when omitted
 * @returns     The Admin API client
 */
export declare function createClient(config?: OptimizelyGraphConfig): OptimizelyGraphAdminApi;
export default createClient;
