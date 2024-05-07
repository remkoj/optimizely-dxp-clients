/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentItem } from '../models/ContentItem';
import type { ContentItemPage } from '../models/ContentItemPage';
import type { ContentMetadata } from '../models/ContentMetadata';
import type { ContentMetadataPage } from '../models/ContentMetadataPage';
import type { CopyContentOptions } from '../models/CopyContentOptions';
import type { VersionStatus } from '../models/VersionStatus';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ContentService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Create content
     * Create a new content item.
     * @param requestBody The content item that should be created.
     * @param skipValidation Indicates that the content validation should be ignored.
     * @returns ContentItem Created
     * @throws ApiError
     */
    public contentCreate(
        requestBody: ContentItem,
        skipValidation?: boolean,
    ): CancelablePromise<ContentItem> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/content',
            query: {
                'skipValidation': skipValidation,
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
     * Get content
     * Get shared metadata about the content instance with the provided key.
     * @param key The key of the content to retrieve metadata for.
     * @param allowDeleted Indicates that metadata for a deleted content may be returned.
     * @returns ContentMetadata Success
     * @throws ApiError
     */
    public contentGetMetadata(
        key: string,
        allowDeleted?: boolean,
    ): CancelablePromise<ContentMetadata> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/content/{key}',
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
    /**
     * Update content
     * Update an existing content item. If a content item with the provided key does not exist an error is returned.
     * @param key The key of the content item to patch.
     * @param requestBody The values of the content item that should be updated.
     * @returns ContentMetadata Success
     * @throws ApiError
     */
    public contentPatchMetadata(
        key: string,
        requestBody: ContentMetadata,
    ): CancelablePromise<ContentMetadata> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/content/{key}',
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
     * Delete content
     * Deletes the content item with the provided key. If a content item with the provided key does not exist an error is returned.
     * @param key The key of the content item to delete.
     * @param permanent Indicates that the content item should be permanently deleted immediately or if it should be soft deleted first.
     * @returns ContentMetadata Success
     * @throws ApiError
     */
    public contentDelete(
        key: string,
        permanent?: boolean,
    ): CancelablePromise<ContentMetadata> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/content/{key}',
            path: {
                'key': key,
            },
            query: {
                'permanent': permanent,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Get content path
     * Get the content path with the provided key.
     * @param key The key of the content path to retrieve.
     * @param pageIndex
     * @param pageSize
     * @returns ContentMetadataPage Success
     * @throws ApiError
     */
    public contentGetPath(
        key: string,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ContentMetadataPage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/content/{key}/path',
            path: {
                'key': key,
            },
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
     * List content in container
     * List the content items located in a specific container.
     * @param key The key of the content to retrieve items for.
     * @param contentTypes Indicates which content types or base types to include in the list.
     * @param pageIndex
     * @param pageSize
     * @returns ContentMetadataPage Success
     * @throws ApiError
     */
    public contentListItems(
        key: string,
        contentTypes?: Array<string>,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ContentMetadataPage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/content/{key}/items',
            path: {
                'key': key,
            },
            query: {
                'contentTypes': contentTypes,
                'pageIndex': pageIndex,
                'pageSize': pageSize,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * List assets
     * List the assets that belongs to a content instance.
     * @param key The key of the content to retrieve assets for.
     * @param contentTypes Indicates which content types or base types to include in the list.
     * @param pageIndex
     * @param pageSize
     * @returns ContentMetadataPage Success
     * @throws ApiError
     */
    public contentListAssets(
        key: string,
        contentTypes?: Array<string>,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ContentMetadataPage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/content/{key}/assets',
            path: {
                'key': key,
            },
            query: {
                'contentTypes': contentTypes,
                'pageIndex': pageIndex,
                'pageSize': pageSize,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Copy content
     * Create a copy of the content item with the provided key.
     * @param key The key of the content item to copy.
     * @param requestBody Optional instructions for how to copy content.
     * @returns ContentMetadata Success
     * @throws ApiError
     */
    public contentCopy(
        key: string,
        requestBody?: CopyContentOptions,
    ): CancelablePromise<ContentMetadata> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/content/{key}:copy',
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
     * Restore content
     * Restore the deleted content item with the provided key. If a content item with the provided key is not deleted an error is returned.
     * @param key The key of the content item to undelete.
     * @returns ContentMetadata Success
     * @throws ApiError
     */
    public contentUndelete(
        key: string,
    ): CancelablePromise<ContentMetadata> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/content/{key}:undelete',
            path: {
                'key': key,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Query versions
     * List content versions based on the provided query options.
     * @param locales Indicates which content locales that should be listed. Use 'NEUTRAL' to include locale-neutral content.
     * Locale must be a valid IETF BCP-47 language tag.
     * @param statuses Indicates which status content versions must have to be listed.
     * @param pageIndex
     * @param pageSize
     * @returns ContentItemPage Success
     * @throws ApiError
     */
    public contentListAllVersions(
        locales?: Array<string>,
        statuses?: Array<VersionStatus>,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ContentItemPage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/content/versions',
            query: {
                'locales': locales,
                'statuses': statuses,
                'pageIndex': pageIndex,
                'pageSize': pageSize,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * List versions
     * List versions of the content item with the provided key and the provided options.
     * @param key
     * @param locales Indicates which content locales that should be listed. Use 'NEUTRAL' to include locale-neutral content.
     * Locale must be a valid IETF BCP-47 language tag.
     * @param statuses Indicates which status content versions must have to be listed.
     * @param pageIndex
     * @param pageSize
     * @returns ContentItemPage Success
     * @throws ApiError
     */
    public contentListVersions(
        key: string,
        locales?: Array<string>,
        statuses?: Array<VersionStatus>,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ContentItemPage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/content/{key}/versions',
            path: {
                'key': key,
            },
            query: {
                'locales': locales,
                'statuses': statuses,
                'pageIndex': pageIndex,
                'pageSize': pageSize,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Create version
     * Create a new version of a content item.
     * @param key The key of the content item for which a new content version should be created.
     * @param requestBody The content version that should be created.
     * @param skipValidation Indicates that the content validation should be ignored.
     * @returns ContentItem Created
     * @throws ApiError
     */
    public contentCreateVersion(
        key: string,
        requestBody: ContentItem,
        skipValidation?: boolean,
    ): CancelablePromise<ContentItem> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/content/{key}/versions',
            path: {
                'key': key,
            },
            query: {
                'skipValidation': skipValidation,
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
     * Delete locale
     * Deletes the content item with the provided key. If a content item with the provided key does not exist an error is returned.
     * @param key
     * @param locale
     * @returns ContentItem Success
     * @throws ApiError
     */
    public contentDeleteLocale(
        key: string,
        locale?: string,
    ): CancelablePromise<ContentItem> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/content/{key}/versions',
            path: {
                'key': key,
            },
            query: {
                'locale': locale,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Get version
     * Get the content item with the provided key and version.
     * @param key
     * @param version
     * @param locale
     * @returns ContentItem Success
     * @throws ApiError
     */
    public contentGetVersion(
        key: string,
        version: string,
        locale?: string,
    ): CancelablePromise<ContentItem> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/content/{key}/versions/{version}',
            path: {
                'key': key,
                'version': version,
            },
            query: {
                'locale': locale,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Update version
     * Update an existing content item. If a content item with the provided key does not exist an error is returned.
     * @param key The key of the content item that should be updated.
     * @param version The version of the content that should be updated.
     * @param requestBody The content information that should be updated.
     * @param locale The locale of the content that should be updated.
     * @param skipValidation Indicates that the content validation should be ignored.
     * @returns ContentItem Success
     * @throws ApiError
     */
    public contentPatchVersion(
        key: string,
        version: string,
        requestBody: ContentItem,
        locale?: string,
        skipValidation?: boolean,
    ): CancelablePromise<ContentItem> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/content/{key}/versions/{version}',
            path: {
                'key': key,
                'version': version,
            },
            query: {
                'locale': locale,
                'skipValidation': skipValidation,
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
     * Delete version
     * Deletes the content item with the provided key. If a content item with the provided key does not exist an error is returned.
     * @param key
     * @param version
     * @returns ContentItem Success
     * @throws ApiError
     */
    public contentDeleteVersion(
        key: string,
        version: string,
    ): CancelablePromise<ContentItem> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/content/{key}/versions/{version}',
            path: {
                'key': key,
                'version': version,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
}
