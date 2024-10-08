/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ImportPackageResult } from '../models/ImportPackageResult';
import type { Manifest } from '../models/Manifest';
import type { PackageJob } from '../models/PackageJob';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class PackagesService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get job status
     * Get a package job status.
     * @param key The key of the package job.
     * @returns PackageJob OK
     * @throws ApiError
     */
    public packagesGet(
        key: string,
    ): CancelablePromise<PackageJob> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/packages/{key}',
            path: {
                'key': key,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Export package
     * Export a data package.
     * @param includeReadOnly Indicates if read-only resources should be included in the export data.
     * @returns Manifest OK
     * @throws ApiError
     */
    public packagesExport(
        includeReadOnly?: boolean,
    ): CancelablePromise<Manifest> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/packages',
            query: {
                'includeReadOnly': includeReadOnly,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Import package
     * Import a data package.
     * @param container The key of the container content where new content items should be created under.
     * @param overwriteExistingContentItems Indicates if the existing content item in CMS could be overwritten when the importing package contains
     * content item with the same key.
     * If set to `false`, always create new content item under the specified container regardless of the content key.
     * @param ignoreDataLossWarnings Updates the content type even though the changes might result in data loss.
     * @param locale Specifies the locale in which content item in that locale will be imported. If no locale is defined
     * then content in all locales are imported.
     * @param requestBody
     * @returns ImportPackageResult OK
     * @returns PackageJob Accepted
     * @throws ApiError
     */
    public packagesImport(
        container?: string,
        overwriteExistingContentItems: boolean = false,
        ignoreDataLossWarnings: boolean = false,
        locale?: string,
        requestBody?: Blob,
    ): CancelablePromise<ImportPackageResult | PackageJob> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/packages',
            query: {
                'container': container,
                'overwriteExistingContentItems': overwriteExistingContentItems,
                'ignoreDataLossWarnings': ignoreDataLossWarnings,
                'locale': locale,
            },
            body: requestBody,
            mediaType: 'application/vnd.episerver.cms.data',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
}
