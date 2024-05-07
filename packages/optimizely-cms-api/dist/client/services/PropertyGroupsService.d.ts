import type { PropertyGroup } from '../models/PropertyGroup';
import type { PropertyGroupPage } from '../models/PropertyGroupPage';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class PropertyGroupsService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * List property groups
     * List property groups using the provided options.
     * @param sources Indicates which property groups sources that should be listed.
     * Use All to include groups from all sources or
     * Default to include groups without a specific sources.
     * @returns PropertyGroupPage Success
     * @throws ApiError
     */
    propertyGroupsList(sources?: Array<string>): CancelablePromise<PropertyGroupPage>;
    /**
     * Create property group
     * Create a new property group.
     * @param requestBody The property group that should be created.
     * @returns PropertyGroup Success
     * @throws ApiError
     */
    propertyGroupsCreate(requestBody: PropertyGroup): CancelablePromise<PropertyGroup>;
    /**
     * Get property group
     * Get the property group with the provided key.
     * @param key The key of the property group to retrieve.
     * @returns PropertyGroup Success
     * @throws ApiError
     */
    propertyGroupsGet(key: string): CancelablePromise<PropertyGroup>;
    /**
     * Create or replace property group
     * Create or replace a property group. If a property group with the provided key exist it is replaced.
     * Otherwise a new property group is created.
     * @param key The key of the property group to update or create.
     * @param requestBody The values of the created or replaced property group.
     * @returns PropertyGroup Success
     * @throws ApiError
     */
    propertyGroupsPut(key: string, requestBody: PropertyGroup): CancelablePromise<PropertyGroup>;
    /**
     * Update property group
     * Update an existing property group.
     * @param key The key of the property group to patch.
     * @param requestBody The values of the property group that should be updated.
     * @returns PropertyGroup Success
     * @throws ApiError
     */
    propertyGroupsPatch(key: string, requestBody: PropertyGroup): CancelablePromise<PropertyGroup>;
    /**
     * Delete property group
     * Deletes the property group with the provided key.
     * @param key The key of the property group to delete.
     * @returns PropertyGroup Success
     * @throws ApiError
     */
    propertyGroupsDelete(key: string): CancelablePromise<PropertyGroup>;
}
