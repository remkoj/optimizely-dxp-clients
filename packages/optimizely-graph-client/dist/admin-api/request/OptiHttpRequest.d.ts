import type { ApiRequestOptions } from '../client/core/ApiRequestOptions.js';
import { BaseHttpRequest } from '../client/core/BaseHttpRequest.js';
import type { CancelablePromise } from '../client/core/CancelablePromise.js';
import type { OpenAPIConfig } from '../client/core/OpenAPI.js';
import type { OptimizelyGraphConfig } from '../../types.js';
export declare class OptiHttpRequest extends BaseHttpRequest {
    protected optiGraphConfig: OptimizelyGraphConfig | undefined;
    constructor(config: OpenAPIConfig);
    setOptiGraphConfig(config: OptimizelyGraphConfig): void;
    /**
     * Request method
     * @param options The request options from the service
     * @returns CancelablePromise<T>
     * @throws ApiError
     */
    request<T>(options: ApiRequestOptions): CancelablePromise<T>;
}
export declare function isOptiHttpRequest(toTest: any): toTest is OptiHttpRequest;
