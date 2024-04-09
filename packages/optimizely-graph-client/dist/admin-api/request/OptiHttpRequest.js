import { BaseHttpRequest } from '../client/core/BaseHttpRequest.js';
import { request as __request } from './request.js';
import { createHmacFetch } from '../../hmac-fetch.js';
export class OptiHttpRequest extends BaseHttpRequest {
    constructor(config) {
        super(config);
    }
    setOptiGraphConfig(config) {
        this.optiGraphConfig = config;
    }
    /**
     * Request method
     * @param options The request options from the service
     * @returns CancelablePromise<T>
     * @throws ApiError
     */
    request(options) {
        const fetchApi = this.optiGraphConfig?.app_key && this.optiGraphConfig?.secret ? createHmacFetch(this.optiGraphConfig.app_key, this.optiGraphConfig.secret) : fetch;
        return __request(this.config, options, fetchApi);
    }
}
export function isOptiHttpRequest(toTest) {
    if (!toTest || typeof (toTest) != 'object')
        return false;
    return typeof (toTest.request) == 'function' && typeof (toTest.setOptiGraphConfig) == 'function';
}
//# sourceMappingURL=OptiHttpRequest.js.map