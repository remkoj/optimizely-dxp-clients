/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PropertyFormat } from '../models/PropertyFormat';
import type { PropertyFormatPage } from '../models/PropertyFormatPage';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class PropertyFormatsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List property formats
     * List all property formats using the provided options.
     * @param pageIndex
     * @param pageSize
     * @returns PropertyFormatPage OK
     * @throws ApiError
     */
    public propertyFormatsList(
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<PropertyFormatPage> {
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
     * @returns PropertyFormat OK
     * @throws ApiError
     */
    public propertyFormatsGet(
        key: string,
        allowDeleted?: boolean,
    ): CancelablePromise<PropertyFormat> {
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
