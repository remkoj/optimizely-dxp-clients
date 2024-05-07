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
     * @param sources Indicates which property groups sources that should be listed.
     * Use All to include groups from all sources or
     * Default to include groups without a specific sources.
     * @returns PropertyGroupPage Success
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
     * @returns PropertyGroup Success
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
     * @returns PropertyGroup Success
     * @throws ApiError
     */
    public propertyGroupsGet(
        key: string,
    ): CancelablePromise<PropertyGroup> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/propertygroups/{key}',
            path: {
                'key': key,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Create or replace property group
     * Create or replace a property group. If a property group with the provided key exist it is replaced.
     * Otherwise a new property group is created.
     * @param key The key of the property group to update or create.
     * @param requestBody The values of the created or replaced property group.
     * @returns PropertyGroup Success
     * @throws ApiError
     */
    public propertyGroupsPut(
        key: string,
        requestBody: PropertyGroup,
    ): CancelablePromise<PropertyGroup> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/propertygroups/{key}',
            path: {
                'key': key,
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
     * Update property group
     * Update an existing property group.
     * @param key The key of the property group to patch.
     * @param requestBody The values of the property group that should be updated.
     * @returns PropertyGroup Success
     * @throws ApiError
     */
    public propertyGroupsPatch(
        key: string,
        requestBody: PropertyGroup,
    ): CancelablePromise<PropertyGroup> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/propertygroups/{key}',
            path: {
                'key': key,
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
     * Delete property group
     * Deletes the property group with the provided key.
     * @param key The key of the property group to delete.
     * @returns PropertyGroup Success
     * @throws ApiError
     */
    public propertyGroupsDelete(
        key: string,
    ): CancelablePromise<PropertyGroup> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/propertygroups/{key}',
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
