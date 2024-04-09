import type { ApiRequestOptions } from '../client/core/ApiRequestOptions.js'
import { BaseHttpRequest } from '../client/core/BaseHttpRequest.js'
import type { CancelablePromise } from '../client/core/CancelablePromise.js'
import type { OpenAPIConfig } from '../client/core/OpenAPI.js'
import { request as __request } from './request.js'
import type { OptimizelyGraphConfig } from '../../types.js'
import { createHmacFetch } from '../../hmac-fetch.js'

export class OptiHttpRequest extends BaseHttpRequest 
{
    protected optiGraphConfig : OptimizelyGraphConfig | undefined

    constructor(config: OpenAPIConfig) {
        super(config);
    }

    public setOptiGraphConfig(config: OptimizelyGraphConfig)
    {
        this.optiGraphConfig = config
    }

    /**
     * Request method
     * @param options The request options from the service
     * @returns CancelablePromise<T>
     * @throws ApiError
     */
    public override request<T>(options: ApiRequestOptions): CancelablePromise<T> {
        const fetchApi = this.optiGraphConfig?.app_key && this.optiGraphConfig?.secret ? createHmacFetch(this.optiGraphConfig.app_key, this.optiGraphConfig.secret) : fetch
        return __request(this.config, options, fetchApi);
    }
}

export function isOptiHttpRequest(toTest: any) : toTest is OptiHttpRequest
{
    if (!toTest || typeof(toTest) != 'object')
        return false

    return typeof((toTest as OptiHttpRequest).request) == 'function' && typeof((toTest as OptiHttpRequest).setOptiGraphConfig) == 'function'
}
