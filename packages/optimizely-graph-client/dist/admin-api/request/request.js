import { getFormData, getRequestBody, getHeaders, getResponseBody, getResponseHeader, getQueryString, catchErrorCodes } from '../client/core/request.js';
import { CancelablePromise } from '../client/core/CancelablePromise.js';
/**
 * Request method
 * @param config The OpenAPI configuration object
 * @param options The request options from the service
 * @param customFetch Optionally a custom implementation of the FetchAPI
 * @returns CancelablePromise<T>
 * @throws ApiError
 */
export const request = (config, options, customFetch) => {
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
                const result = {
                    url,
                    ok: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    body: responseHeader ?? responseBody,
                };
                catchErrorCodes(options, result);
                resolve(result.body);
            }
        }
        catch (error) {
            reject(error);
        }
    });
};
export const sendRequest = async (config, options, url, body, formData, headers, onCancel, customFetch) => {
    const controller = new AbortController();
    const request = {
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
    console.log("AdminAPI URL:", url);
    return await (customFetch ? customFetch(url, request) : fetch(url, request));
};
const getUrl = (config, options) => {
    const encoder = config.ENCODE_PATH || encodeURI;
    const path = options.url
        .replace('{api-version}', config.VERSION)
        .replace(/{(.*?)}/g, (substring, group) => {
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
//# sourceMappingURL=request.js.map