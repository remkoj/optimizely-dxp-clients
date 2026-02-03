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
     * @param ifNoneMatch If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored.
     * @param ifModifiedSince If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided.
     * @returns PropertyFormat OK
     * @throws ApiError
     */
    public propertyFormatsGet(
        key: string,
        allowDeleted?: boolean,
        ifNoneMatch?: string,
        ifModifiedSince?: string,
    ): CancelablePromise<PropertyFormat> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/propertyformats/{key}',
            path: {
                'key': key,
            },
            headers: {
                'If-None-Match': ifNoneMatch,
                'If-Modified-Since': ifModifiedSince,
            },
            query: {
                'allowDeleted': allowDeleted,
            },
            errors: {
                304: `Not Modified`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
}
