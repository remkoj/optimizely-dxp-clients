/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Blueprint } from '../models/Blueprint';
import type { BlueprintPage } from '../models/BlueprintPage';
import type { BlueprintPatch } from '../models/BlueprintPatch';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class BlueprintsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List blueprints
     * List blueprints using the provided parameters.
     * @param pageIndex Zero based index of the page that should be retrieved.
     * @param pageSize The maximum items per page that should be retrieved.
     * @returns BlueprintPage OK
     * @throws ApiError
     */
    public blueprintsList(
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<BlueprintPage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/blueprints',
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
     * Create blueprint
     * Create a new blueprint.
     * @param requestBody The blueprint that should be created.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @returns Blueprint Created
     * @throws ApiError
     */
    public blueprintsCreate(
        requestBody: Blueprint,
        prefer?: Array<string>,
    ): CancelablePromise<Blueprint> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/blueprints',
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
     * Get blueprint
     * Get the blueprint with the provided key.
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
            url: '/blueprints/{key}',
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
     * Patch blueprint
     * Patch an existing blueprint.
     * @param key The key of the blueprint to patch.
     * @param requestBody The values of the blueprint that should be patched formatted according to RFC7396.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @param ifMatch If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @returns Blueprint OK
     * @throws ApiError
     */
    public blueprintsPatch(
        key: string,
        requestBody: BlueprintPatch,
        prefer?: Array<string>,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
    ): CancelablePromise<Blueprint> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/blueprints/{key}',
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
     * Delete blueprint
     * Deletes the blueprint with the provided key.
     * @param key The key of the blueprint to delete.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @param ifMatch If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @returns Blueprint OK
     * @throws ApiError
     */
    public blueprintsDelete(
        key: string,
        prefer?: Array<string>,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
    ): CancelablePromise<Blueprint> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/blueprints/{key}',
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
