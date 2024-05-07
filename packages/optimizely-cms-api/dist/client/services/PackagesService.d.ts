import type { ImportPackageResult } from '../models/ImportPackageResult';
import type { Manifest } from '../models/Manifest';
import type { PackageJob } from '../models/PackageJob';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class PackagesService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * Get job status
     * Get a package job status.
     * @param key The key of the package job.
     * @returns PackageJob Success
     * @throws ApiError
     */
    packagesGet(key: string): CancelablePromise<PackageJob>;
    /**
     * Export package
     * Export a data package.
     * @param includeReadOnly Indicates if read-only resources should be included in the export data.
     * @returns Manifest Success
     * @throws ApiError
     */
    packagesExport(includeReadOnly?: boolean): CancelablePromise<Manifest>;
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
     * @returns ImportPackageResult Success
     * @returns PackageJob Accepted
     * @throws ApiError
     */
    packagesImport(container?: string, overwriteExistingContentItems?: boolean, ignoreDataLossWarnings?: boolean, locale?: string, requestBody?: Blob): CancelablePromise<ImportPackageResult | PackageJob>;
}
