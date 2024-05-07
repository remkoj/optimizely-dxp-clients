"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyFormatsService = void 0;
class PropertyFormatsService {
    constructor(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * List property formats
     * List all property formats using the provided options.
     * @param pageIndex
     * @param pageSize
     * @returns PropertyFormatPage Success
     * @throws ApiError
     */
    propertyFormatsList(pageIndex, pageSize) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/propertyformats',
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
     * Get property format
     * Get the property format with the provided key.
     * @param key The key of the property format to retrieve.
     * @param allowDeleted Indicates that a deleted property format may be returned.
     * @returns PropertyFormat Success
     * @throws ApiError
     */
    propertyFormatsGet(key, allowDeleted) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/propertyformats/{key}',
            path: {
                'key': key,
            },
            query: {
                'allowDeleted': allowDeleted,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
}
exports.PropertyFormatsService = PropertyFormatsService;
