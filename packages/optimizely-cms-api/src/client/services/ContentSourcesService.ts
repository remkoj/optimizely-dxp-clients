/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentSource } from '../models/ContentSource';
import type { ContentSourcePage } from '../models/ContentSourcePage';
import type { ContentSourcePatch } from '../models/ContentSourcePatch';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ContentSourcesService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List content sources
     * List content sources using the provided options.
     * @param pageIndex Zero based index of the page that should be retrieved.
     * @param pageSize The maximum items per page that should be retrieved.
     * @returns ContentSourcePage OK
     * @throws ApiError
     */
    public contentSourcesList(
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ContentSourcePage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/contentsources',
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
     * Create contentsource
     * Create a new contentsource.
     * @param requestBody The contentsource that should be created.
     * @param cmsSkipValidation Indicates which content validation rules should be bypassed. Supported values are '*' (skip all validations), 'data' (skip data validation), and 'references' (skip reference validation). Values can be combined, empty or duplicated values are ignored, and any unknown values result in a validation error. Use with caution as this may allow creation of invalid content that could cause issues in production.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @returns ContentSource Created
     * @throws ApiError
     */
    public contentSourcesCreate(
        requestBody: ContentSource,
        cmsSkipValidation?: Array<'*' | 'data' | 'references'>,
        prefer?: Array<string>,
    ): CancelablePromise<ContentSource> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/contentsources',
            headers: {
                'cms-skip-validation': cmsSkipValidation,
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
     * Get contentsource
     * Get the contentsource with the provided key.
     * @param key The key of the contentsource to retrieve.
     * @param ifNoneMatch If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored.
     * @param ifModifiedSince If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided.
     * @returns ContentSource OK
     * @throws ApiError
     */
    public contentSourcesGet(
        key: string,
        ifNoneMatch?: string,
        ifModifiedSince?: string,
    ): CancelablePromise<ContentSource> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/contentsources/{key}',
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
     * Patch contentsource
     * Patch an existing contentsource.
     * @param key The key of the contentsource to patch.
     * @param requestBody The values of the contentsource that should be patched formatted according to RFC7396.
     * @param cmsSkipValidation Indicates which content validation rules should be bypassed. Supported values are '*' (skip all validations), 'data' (skip data validation), and 'references' (skip reference validation). Values can be combined, empty or duplicated values are ignored, and any unknown values result in a validation error. Use with caution as this may allow creation of invalid content that could cause issues in production.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @param ifMatch If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @returns ContentSource OK
     * @throws ApiError
     */
    public contentSourcesPatch(
        key: string,
        requestBody: ContentSourcePatch,
        cmsSkipValidation?: Array<'*' | 'data' | 'references'>,
        prefer?: Array<string>,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
    ): CancelablePromise<ContentSource> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/contentsources/{key}',
            path: {
                'key': key,
            },
            headers: {
                'cms-skip-validation': cmsSkipValidation,
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
     * Delete contentsource
     * Deletes the contentsource with the provided key.
     * @param key The key of the contentsource to delete.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @param ifMatch If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @returns ContentSource OK
     * @throws ApiError
     */
    public contentSourcesDelete(
        key: string,
        prefer?: Array<string>,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
    ): CancelablePromise<ContentSource> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/contentsources/{key}',
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
