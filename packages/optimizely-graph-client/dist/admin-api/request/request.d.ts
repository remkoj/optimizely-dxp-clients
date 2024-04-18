import type { ApiRequestOptions } from '../client/core/ApiRequestOptions.js';
import { CancelablePromise, type OnCancel } from '../client/core/CancelablePromise.js';
import type { FetchAPI } from '../../hmac-fetch.js';
/**
 * Request method
 * @param config The OpenAPI configuration object
 * @param options The request options from the service
 * @param customFetch Optionally a custom implementation of the FetchAPI
 * @returns CancelablePromise<T>
 * @throws ApiError
 */
export declare const request: <T>(config: OpenAPIConfig, options: ApiRequestOptions, customFetch?: FetchAPI) => CancelablePromise<T>;
export declare const sendRequest: (config: OpenAPIConfig, options: ApiRequestOptions, url: string, body: any, formData: FormData | undefined, headers: Headers, onCancel: OnCancel, customFetch?: FetchAPI) => Promise<Response>;
