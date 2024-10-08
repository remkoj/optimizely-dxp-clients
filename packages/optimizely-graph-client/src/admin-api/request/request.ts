import { getFormData, getRequestBody, getHeaders, getResponseBody, getResponseHeader, getQueryString, catchErrorCodes } from '../client/core/request.js'
import type { ApiResult } from '../client/core/ApiResult.js';
import type { OpenAPIConfig } from '../client/core/OpenAPI.js';
import type { ApiRequestOptions } from '../client/core/ApiRequestOptions.js';
import { CancelablePromise, type OnCancel } from '../client/core/CancelablePromise.js';
import type { FetchAPI } from '../../hmac-fetch.js'

/**
 * Request method
 * @param config The OpenAPI configuration object
 * @param options The request options from the service
 * @param customFetch Optionally a custom implementation of the FetchAPI
 * @returns CancelablePromise<T>
 * @throws ApiError
 */
export const request = <T>(config: OpenAPIConfig, options: ApiRequestOptions, customFetch?: FetchAPI): CancelablePromise<T> => {
    return new CancelablePromise(async (resolve, reject, onCancel) => {
        try {
            const url = getUrl(config, options);
            const formData = getFormData(options);
            const body = getRequestBody(options);
            const headers = await getHeaders(config, options);

            if (!onCancel.isCancelled) {
                const response = await sendRequest(config, options, url, body, formData, headers, onCancel, customFetch);
                const responseBody = await getResponseBody(response);
                const responseHeader = getResponseHeader(response, options.responseHeader);

                const result: ApiResult = {
                    url,
                    ok: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    body: responseHeader ?? responseBody,
                };

                catchErrorCodes(options, result);

                resolve(result.body);
            }
        } catch (error) {
            reject(error);
        }
    });
};

export const sendRequest = async (
    config: OpenAPIConfig,
    options: ApiRequestOptions,
    url: string,
    body: any,
    formData: FormData | undefined,
    headers: Headers,
    onCancel: OnCancel,
    customFetch?: FetchAPI
): Promise<Response> => {
    const controller = new AbortController();

    const request: RequestInit = {
        headers,
        body: body ?? formData,
        method: options.method,
        signal: controller.signal,
        cache: 'no-store',
        keepalive: false
    };

    if (config.WITH_CREDENTIALS) {
        request.credentials = config.CREDENTIALS;
    }

    onCancel(() => controller.abort());

    return await (customFetch ? customFetch(url, request) : fetch(url, request));
};

const getUrl = (config: OpenAPIConfig, options: ApiRequestOptions): string => {
    const encoder = config.ENCODE_PATH || encodeURI;

    const path = options.url
        .replace('{api-version}', config.VERSION)
        .replace(/{(.*?)}/g, (substring: string, group: string) => {
            if (options.path?.hasOwnProperty(group)) {
                return encoder(String(options.path[group]));
            }
            return substring;
        });

    const url = `${config.BASE}${path}`;
    if (options.query) {
        return `${url}${getQueryString(options.query)}`;
    }
    return url;
};