/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentTypeBinding } from '../models/ContentTypeBinding';
import type { ContentTypeBindingPage } from '../models/ContentTypeBindingPage';
import type { ContentTypeBindingPatch } from '../models/ContentTypeBindingPatch';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ContentTypeBindingsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List content type bindings
     * List type bindings using the provided options.
     * @param pageIndex Zero based index of the page that should be retrieved.
     * @param pageSize The maximum items per page that should be retrieved.
     * @returns ContentTypeBindingPage OK
     * @throws ApiError
     */
    public contentTypeBindingsList(
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ContentTypeBindingPage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/contenttypebindings',
            query: {
                'pageIndex': pageIndex,
                'pageSize': pageSize,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Create contenttypebinding
     * Create a new contenttypebinding.
     * @param requestBody The contenttypebinding that should be created.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @returns ContentTypeBinding Created
     * @throws ApiError
     */
    public contentTypeBindingsCreate(
        requestBody: ContentTypeBinding,
        prefer?: Array<string>,
    ): CancelablePromise<ContentTypeBinding> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/contenttypebindings',
            headers: {
                'Prefer': prefer,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                409: `Conflict`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get contenttypebinding
     * Get the contenttypebinding with the provided key.
     * @param key The key of the contenttypebinding to retrieve.
     * @param ifNoneMatch If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored.
     * @param ifModifiedSince If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided.
     * @returns ContentTypeBinding OK
     * @throws ApiError
     */
    public contentTypeBindingsGet(
        key: string,
        ifNoneMatch?: string,
        ifModifiedSince?: string,
    ): CancelablePromise<ContentTypeBinding> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/contenttypebindings/{key}',
            path: {
                'key': key,
            },
            headers: {
                'If-None-Match': ifNoneMatch,
                'If-Modified-Since': ifModifiedSince,
            },
            errors: {
                304: `Not Modified`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Patch contenttypebinding
     * Patch an existing contenttypebinding.
     * @param key The key of the contenttypebinding to patch.
     * @param requestBody The values of the contenttypebinding that should be patched formatted according to RFC7396.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @param ifMatch If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @returns ContentTypeBinding OK
     * @throws ApiError
     */
    public contentTypeBindingsPatch(
        key: string,
        requestBody: ContentTypeBindingPatch,
        prefer?: Array<string>,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
    ): CancelablePromise<ContentTypeBinding> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/contenttypebindings/{key}',
            path: {
                'key': key,
            },
            headers: {
                'Prefer': prefer,
                'If-Match': ifMatch,
                'If-Unmodified-Since': ifUnmodifiedSince,
            },
            body: requestBody,
            mediaType: 'application/merge-patch+json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                412: `Precondition Failed`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete contenttypebinding
     * Deletes the contenttypebinding with the provided key.
     * @param key The key of the contenttypebinding to delete.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @param ifMatch If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @returns ContentTypeBinding OK
     * @throws ApiError
     */
    public contentTypeBindingsDelete(
        key: string,
        prefer?: Array<string>,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
    ): CancelablePromise<ContentTypeBinding> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/contenttypebindings/{key}',
            path: {
                'key': key,
            },
            headers: {
                'Prefer': prefer,
                'If-Match': ifMatch,
                'If-Unmodified-Since': ifUnmodifiedSince,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                412: `Precondition Failed`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
}
