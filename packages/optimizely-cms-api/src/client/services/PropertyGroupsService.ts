/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PropertyGroup } from '../models/PropertyGroup';
import type { PropertyGroupPage } from '../models/PropertyGroupPage';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class PropertyGroupsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List property groups
     * List property groups using the provided options.
     * @param sources Indicates which property groups sources should be listed.
     * Use 'DEFAULT' to include groups without a specific sources.
     * @returns PropertyGroupPage OK
     * @throws ApiError
     */
    public propertyGroupsList(
        sources?: Array<string>,
    ): CancelablePromise<PropertyGroupPage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/propertygroups',
            query: {
                'sources': sources,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Create property group
     * Create a new property group.
     * @param requestBody The property group that should be created.
     * @returns PropertyGroup Created
     * @throws ApiError
     */
    public propertyGroupsCreate(
        requestBody: PropertyGroup,
    ): CancelablePromise<PropertyGroup> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/propertygroups',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Get property group
     * Get the property group with the provided key.
     * @param key The key of the property group to retrieve.
     * @param ifNoneMatch If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored.
     * @param ifModifiedSince If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided.
     * @returns PropertyGroup OK
     * @throws ApiError
     */
    public propertyGroupsGet(
        key: string,
        ifNoneMatch?: string,
        ifModifiedSince?: string,
    ): CancelablePromise<PropertyGroup> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/propertygroups/{key}',
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
     * Patch property group
     * Patch an existing property group.
     * @param key The key of the property group to patch.
     * @param requestBody The values of the property group that should be patched formatted according to RFC7396.
     * @param ifMatch If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @returns PropertyGroup OK
     * @throws ApiError
     */
    public propertyGroupsPatch(
        key: string,
        requestBody: PropertyGroup,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
    ): CancelablePromise<PropertyGroup> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/propertygroups/{key}',
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
     * Delete property group
     * Deletes the property group with the provided key.
     * @param key The key of the property group to delete.
     * @param ifMatch If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @returns PropertyGroup OK
     * @throws ApiError
     */
    public propertyGroupsDelete(
        key: string,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
    ): CancelablePromise<PropertyGroup> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/propertygroups/{key}',
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
