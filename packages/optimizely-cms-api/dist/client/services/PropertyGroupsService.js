"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyGroupsService = void 0;
class PropertyGroupsService {
    constructor(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * List property groups
     * List property groups using the provided options.
     * @param sources Indicates which property groups sources that should be listed.
     * Use All to include groups from all sources or
     * Default to include groups without a specific sources.
     * @returns PropertyGroupPage Success
     * @throws ApiError
     */
    propertyGroupsList(sources) {
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
    propertyGroupsCreate(requestBody) {
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
    propertyGroupsGet(key) {
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
    propertyGroupsPut(key, requestBody) {
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
    propertyGroupsPatch(key, requestBody) {
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
    propertyGroupsDelete(key) {
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
exports.PropertyGroupsService = PropertyGroupsService;
