/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentType } from '../models/ContentType';
import type { ContentTypePage } from '../models/ContentTypePage';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ContentTypesService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List content types
     * List content types using the provided parameters.
     * @param forContainerType Only include types that are available for creation under the provided container type
     * @param sources Indicates which sources should be included when listing content types.
     * Use 'DEFAULT' to include content types without a specific source.
     * @param pageIndex
     * @param pageSize
     * @returns ContentTypePage OK
     * @throws ApiError
     */
    public contentTypesList(
        forContainerType?: string,
        sources?: Array<string>,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ContentTypePage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/contenttypes',
            query: {
                'forContainerType': forContainerType,
                'sources': sources,
                'pageIndex': pageIndex,
                'pageSize': pageSize,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Create content type
     * Create a new content type.
     * @param requestBody The content type that should be created or replaced.
     * @returns ContentType Created
     * @throws ApiError
     */
    public contentTypesCreate(
        requestBody: ContentType,
    ): CancelablePromise<ContentType> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/contenttypes',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Get content type
     * Get the content type with the provided key.
     * @param key The key of the content type to retrieve.
     * @param ifNoneMatch If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored.
     * @param ifModifiedSince If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided.
     * @returns ContentType OK
     * @throws ApiError
     */
    public contentTypesGet(
        key: string,
        ifNoneMatch?: string,
        ifModifiedSince?: string,
    ): CancelablePromise<ContentType> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/contenttypes/{key}',
            path: {
                'key': key,
            },
            headers: {
                'If-None-Match': ifNoneMatch,
                'If-Modified-Since': ifModifiedSince,
            },
            errors: {
                304: `Not Modified`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Patch content type
     * Patch an existing content type. If a content type with the provided key does not exist an error is returned.
     * @param key The key of the content type to patch.
     * @param requestBody The values of the content type that should be patched formatted according to RFC7396.
     * @param cmsIgnoreDataLossWarnings Patch the content type even though the changes might result in data loss.
     * @param ifMatch If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @returns ContentType OK
     * @throws ApiError
     */
    public contentTypesPatch(
        key: string,
        requestBody: ContentType,
        cmsIgnoreDataLossWarnings?: boolean,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
    ): CancelablePromise<ContentType> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/contenttypes/{key}',
            path: {
                'key': key,
            },
            headers: {
                'cms-ignore-data-loss-warnings': cmsIgnoreDataLossWarnings,
                'If-Match': ifMatch,
                'If-Unmodified-Since': ifUnmodifiedSince,
            },
            body: requestBody,
            mediaType: 'application/merge-patch+json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
                412: `Precondition Failed`,
            },
        });
    }
    /**
     * Delete content type
     * Deletes the content type with the provided key. If a content type with the provided key does not exist an error is returned.
     * @param key The key of the content type to delete.
     * @param ifMatch If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @returns ContentType OK
     * @throws ApiError
     */
    public contentTypesDelete(
        key: string,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
    ): CancelablePromise<ContentType> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/contenttypes/{key}',
            path: {
                'key': key,
            },
            headers: {
                'If-Match': ifMatch,
                'If-Unmodified-Since': ifUnmodifiedSince,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
                412: `Precondition Failed`,
            },
        });
    }
}
