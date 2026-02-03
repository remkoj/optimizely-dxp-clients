/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Blueprint } from '../models/Blueprint';
import type { BlueprintPage } from '../models/BlueprintPage';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class BlueprintsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List blueprints
     * List blueprints using the provided parameters. This API is experimental and may change in future releases.
     * @param pageIndex
     * @param pageSize
     * @returns BlueprintPage OK
     * @throws ApiError
     */
    public blueprintsList(
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<BlueprintPage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/experimental/blueprints',
            query: {
                'pageIndex': pageIndex,
                'pageSize': pageSize,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Create a blueprint
     * Create a new blueprint. This API is experimental and may change in future releases.
     * @param requestBody The blueprint that should be created.
     * @returns Blueprint Created
     * @throws ApiError
     */
    public blueprintsCreate(
        requestBody: Blueprint,
    ): CancelablePromise<Blueprint> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/experimental/blueprints',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Get a specific blueprint
     * Get the blueprint with the provided key. This API is experimental and may change in future releases.
     * @param key The key of the blueprint to retrieve.
     * @param ifNoneMatch If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored.
     * @param ifModifiedSince If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided.
     * @returns Blueprint OK
     * @throws ApiError
     */
    public blueprintsGet(
        key: string,
        ifNoneMatch?: string,
        ifModifiedSince?: string,
    ): CancelablePromise<Blueprint> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/experimental/blueprints/{key}',
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
     * Patch blueprint
     * Patch an existing blueprint. This API is experimental and may change in future releases.
     * @param key The key of the blueprint to patch.
     * @param requestBody The values of the blueprint that should be patched formatted according to RFC7396.
     * @param ifMatch If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @returns Blueprint OK
     * @throws ApiError
     */
    public blueprintsPatch(
        key: string,
        requestBody: Blueprint,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
    ): CancelablePromise<Blueprint> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/experimental/blueprints/{key}',
            path: {
                'key': key,
            },
            headers: {
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
     * Delete a blueprint
     * Deletes the blueprint with the provided key. This API is experimental and may change in future releases.
     * @param key The key of the blueprint to delete.
     * @param ifMatch If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @returns Blueprint OK
     * @throws ApiError
     */
    public blueprintsDelete(
        key: string,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
    ): CancelablePromise<Blueprint> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/experimental/blueprints/{key}',
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
