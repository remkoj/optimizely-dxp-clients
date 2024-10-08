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
     * List content types using the provided options.
     * @param forContainerType Only include types that are available for creation under the provided container type
     * @param sources Indicates which sources should be included when listing content types.
     * Use All to include content types from all sources or
     * Default to include content types without a specific sources.
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
     * @param requestBody The content type that should be created.
     * @returns ContentType OK
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
     * @returns ContentType OK
     * @throws ApiError
     */
    public contentTypesGet(
        key: string,
    ): CancelablePromise<ContentType> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/contenttypes/{key}',
            path: {
                'key': key,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Create or replace content type
     * Create or replace a content type. If a content type with the provided key exist it is replaced.
     * Otherwise a new content type is created.
     * @param key The key of the content type to update or create.
     * @param requestBody The values of the created or replaced content type.
     * @param ignoreDataLossWarnings Update the content type even though the changes might result in data loss.
     * @returns ContentType OK
     * @throws ApiError
     */
    public contentTypesPut(
        key: string,
        requestBody: ContentType,
        ignoreDataLossWarnings?: boolean,
    ): CancelablePromise<ContentType> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/contenttypes/{key}',
            path: {
                'key': key,
            },
            query: {
                'ignoreDataLossWarnings': ignoreDataLossWarnings,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Update content type
     * Update an existing content type. If a content type with the provided key does not exist an error is returned.
     * @param key The key of the content type to patch.
     * @param requestBody The values of the content type that should be updated.
     * @param ignoreDataLossWarnings Update the content type even though the changes might result in data loss.
     * @returns ContentType OK
     * @throws ApiError
     */
    public contentTypesPatch(
        key: string,
        requestBody: ContentType,
        ignoreDataLossWarnings?: boolean,
    ): CancelablePromise<ContentType> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/contenttypes/{key}',
            path: {
                'key': key,
            },
            query: {
                'ignoreDataLossWarnings': ignoreDataLossWarnings,
            },
            body: requestBody,
            mediaType: 'application/merge-patch+json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Delete content type
     * Deletes the content type with the provided key. If a content type with the provided key does not exist an error is returned.
     * @param key The key of the content type to delete.
     * @returns ContentType OK
     * @throws ApiError
     */
    public contentTypesDelete(
        key: string,
    ): CancelablePromise<ContentType> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/contenttypes/{key}',
            path: {
                'key': key,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
}
