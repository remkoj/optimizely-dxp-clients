import type { PropertyFormat } from '../models/PropertyFormat';
import type { PropertyFormatPage } from '../models/PropertyFormatPage';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class PropertyFormatsService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * List property formats
     * List all property formats using the provided options.
     * @param pageIndex
     * @param pageSize
     * @returns PropertyFormatPage Success
     * @throws ApiError
     */
    propertyFormatsList(pageIndex?: number, pageSize?: number): CancelablePromise<PropertyFormatPage>;
    /**
     * Get property format
     * Get the property format with the provided key.
     * @param key The key of the property format to retrieve.
     * @param allowDeleted Indicates that a deleted property format may be returned.
     * @returns PropertyFormat Success
     * @throws ApiError
     */
    propertyFormatsGet(key: string, allowDeleted?: boolean): CancelablePromise<PropertyFormat>;
}
