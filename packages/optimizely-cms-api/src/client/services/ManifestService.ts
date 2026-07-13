/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Manifest } from '../models/Manifest';
import type { ManifestImportResult } from '../models/ManifestImportResult';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ManifestService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Export manifest
     * Export a CMS content manifest.
     * @param sections The sections that should be included in the manifest export. If not provided, all sections will be included.
     * @param includeReadOnly Indicates if read-only resources should be included in the manifest export.
     * @returns Manifest OK
     * @throws ApiError
     */
    public manifestExport(
        sections?: Array<'locales' | 'contentTypes' | 'propertyGroups' | 'displayTemplates'>,
        includeReadOnly: boolean = false,
    ): CancelablePromise<Manifest> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/manifest',
            query: {
                'sections': sections,
                'includeReadOnly': includeReadOnly,
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
     * Import manifest
     * Import a CMS content manifest.
     * @param requestBody The manifest that should be imported.
     * @param cmsIgnoreDataLossWarnings Indicates if manifest resources should be updated even though the changes might result in data loss.
     * @returns ManifestImportResult OK
     * @returns any Accepted
     * @throws ApiError
     */
    public manifestImport(
        requestBody: Manifest,
        cmsIgnoreDataLossWarnings: boolean = false,
    ): CancelablePromise<ManifestImportResult | any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/manifest',
            headers: {
                'cms-ignore-data-loss-warnings': cmsIgnoreDataLossWarnings,
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
}
