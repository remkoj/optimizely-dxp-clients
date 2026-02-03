/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentItem } from '../models/ContentItem';
import type { ContentItemPage } from '../models/ContentItemPage';
import type { ContentMetadata } from '../models/ContentMetadata';
import type { ContentMetadataPage } from '../models/ContentMetadataPage';
import type { CopyContentOptions } from '../models/CopyContentOptions';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ContentService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Create content
     * Create a new content item. This API is experimental and may change in future releases.
     * @param requestBody The content item that should be created.
     * @param cmsSkipValidation Indicates that the content validation should be ignored.
     * @returns ContentItem Created
     * @throws ApiError
     */
    public contentCreate(
        requestBody: ContentItem,
        cmsSkipValidation?: boolean,
    ): CancelablePromise<ContentItem> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/experimental/content',
            headers: {
                'cms-skip-validation': cmsSkipValidation,
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
     * Get shared metadata about the content instance with the provided key. This API is experimental and may change in future releases.
     * @param key The key of the content to retrieve metadata for.
     * @param allowDeleted Indicates that metadata for a deleted content may be returned.
     * @returns ContentMetadata OK
     * @throws ApiError
     */
    public contentGetMetadata(
        key: string,
        allowDeleted?: boolean,
    ): CancelablePromise<ContentMetadata> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/experimental/content/{key}',
            path: {
                'key': key,
            },
            query: {
                'allowDeleted': allowDeleted,
            },
            errors: {
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Patch content
     * Patch an existing content item. If a content item with the provided key does not exist an error is returned. This API is experimental and may change in future releases.
     * @param key The key of the content item to patch.
     * @param requestBody The values of the content item that should be patched.
     * @returns ContentMetadata OK
     * @throws ApiError
     */
    public contentPatchMetadata(
        key: string,
        requestBody: ContentMetadata,
    ): CancelablePromise<ContentMetadata> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/experimental/content/{key}',
            path: {
                'key': key,
            },
            body: requestBody,
            mediaType: 'application/merge-patch+json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Delete content
     * Deletes the content item with the provided key. If a content item with the provided key does not exist an error is returned. This API is experimental and may change in future releases.
     * @param key The key of the content item to delete.
     * @param cmsPermanentDelete Indicates that the content item should be permanently deleted immediately or if it should be soft deleted first.
     * @returns ContentMetadata OK
     * @throws ApiError
     */
    public contentDelete(
        key: string,
        cmsPermanentDelete?: boolean,
    ): CancelablePromise<ContentMetadata> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/experimental/content/{key}',
            path: {
                'key': key,
            },
            headers: {
                'cms-permanent-delete': cmsPermanentDelete,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Get content path
     * Get the content path with the provided key. This API is experimental and may change in future releases.
     * @param key The key of the content path to retrieve.
     * @param pageIndex
     * @param pageSize
     * @returns ContentMetadataPage OK
     * @throws ApiError
     */
    public contentGetPath(
        key: string,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ContentMetadataPage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/experimental/content/{key}/path',
            path: {
                'key': key,
            },
            query: {
                'pageIndex': pageIndex,
                'pageSize': pageSize,
            },
            errors: {
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * List content in container
     * List the content items located in a specific container. This API is experimental and may change in future releases.
     * @param key The key of the content to retrieve items for.
     * @param contentTypes Indicates which content types or base types to include in the list.
     * @param pageIndex
     * @param pageSize
     * @returns ContentMetadataPage OK
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
            url: '/experimental/content/{key}/items',
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
                404: `Not Found`,
            },
        });
    }
    /**
     * List assets
     * List the assets that belongs to a content instance. This API is experimental and may change in future releases.
     * @param key The key of the content to retrieve assets for.
     * @param contentTypes Indicates which content types or base types to include in the list.
     * @param pageIndex
     * @param pageSize
     * @returns ContentMetadataPage OK
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
            url: '/experimental/content/{key}/assets',
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
                404: `Not Found`,
            },
        });
    }
    /**
     * Copy content
     * Create a copy of the content item with the provided key. This API is experimental and may change in future releases.
     * @param key The key of the content item to copy.
     * @param requestBody Optional instructions for how to copy content.
     * @returns ContentMetadata OK
     * @throws ApiError
     */
    public contentCopy(
        key: string,
        requestBody?: CopyContentOptions,
    ): CancelablePromise<ContentMetadata> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/experimental/content/{key}:copy',
            path: {
                'key': key,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Restore content
     * Restore the deleted content item with the provided key. If a content item with the provided key is not deleted an error is returned. This API is experimental and may change in future releases.
     * @param key The key of the content item to undelete.
     * @returns ContentMetadata OK
     * @throws ApiError
     */
    public contentUndelete(
        key: string,
    ): CancelablePromise<ContentMetadata> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/experimental/content/{key}:undelete',
            path: {
                'key': key,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Query versions
     * List content versions based on the provided query options. This API is experimental and may change in future releases.
     * @param locales Indicates which content locales that should be listed. Use 'NEUTRAL' to include locale-neutral content.
     * Locale must be a valid IETF BCP-47 language tag.
     * @param statuses Indicates which status content versions must have to be listed.
     * @param pageIndex
     * @param pageSize
     * @returns ContentItemPage OK
     * @throws ApiError
     */
    public contentListAllVersions(
        locales?: Array<string>,
        statuses?: Array<'draft' | 'ready' | 'published' | 'previous' | 'scheduled' | 'rejected' | 'inReview'>,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ContentItemPage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/experimental/content/versions',
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
     * List versions of the content item with the provided key and the provided options. This API is experimental and may change in future releases.
     * @param key
     * @param locales Indicates which content locales that should be listed. Use 'NEUTRAL' to include locale-neutral content.
     * Locale must be a valid IETF BCP-47 language tag.
     * @param statuses Indicates which status content versions must have to be listed.
     * @param pageIndex
     * @param pageSize
     * @returns ContentItemPage OK
     * @throws ApiError
     */
    public contentListVersions(
        key: string,
        locales?: Array<string>,
        statuses?: Array<'draft' | 'ready' | 'published' | 'previous' | 'scheduled' | 'rejected' | 'inReview'>,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ContentItemPage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/experimental/content/{key}/versions',
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
                404: `Not Found`,
            },
        });
    }
    /**
     * Create version
     * Create a new version of a content item. This API is experimental and may change in future releases.
     * @param key The key of the content item for which a new content version should be created.
     * @param requestBody The content version that should be created.
     * @param cmsSkipValidation Indicates that the content validation should be ignored.
     * @returns ContentItem Created
     * @throws ApiError
     */
    public contentCreateVersion(
        key: string,
        requestBody: ContentItem,
        cmsSkipValidation?: boolean,
    ): CancelablePromise<ContentItem> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/experimental/content/{key}/versions',
            path: {
                'key': key,
            },
            headers: {
                'cms-skip-validation': cmsSkipValidation,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Delete locale
     * Deletes the content item with the provided key. If a content item with the provided key does not exist an error is returned. This API is experimental and may change in future releases.
     * @param key
     * @param locale
     * @returns ContentItem OK
     * @throws ApiError
     */
    public contentDeleteLocale(
        key: string,
        locale?: string,
    ): CancelablePromise<ContentItem> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/experimental/content/{key}/versions',
            path: {
                'key': key,
            },
            query: {
                'locale': locale,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Get version
     * Get the content item with the provided key and version. This API is experimental and may change in future releases.
     * @param key
     * @param version
     * @param locale
     * @param ifNoneMatch If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored.
     * @param ifModifiedSince If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided.
     * @returns ContentItem OK
     * @throws ApiError
     */
    public contentGetVersion(
        key: string,
        version: string,
        locale?: string,
        ifNoneMatch?: string,
        ifModifiedSince?: string,
    ): CancelablePromise<ContentItem> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/experimental/content/{key}/versions/{version}',
            path: {
                'key': key,
                'version': version,
            },
            headers: {
                'If-None-Match': ifNoneMatch,
                'If-Modified-Since': ifModifiedSince,
            },
            query: {
                'locale': locale,
            },
            errors: {
                304: `Not Modified`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Patch version
     * Patch an existing content item. If a content item with the provided key does not exist an error is returned. This API is experimental and may change in future releases.
     * @param key The key of the content item that should be patched.
     * @param version The version of the content that should be patched.
     * @param requestBody The content information that should be patched.
     * @param locale The locale of the content that should be patched.
     * @param cmsSkipValidation Indicates that the content validation should be ignored.
     * @returns ContentItem OK
     * @throws ApiError
     */
    public contentPatchVersion(
        key: string,
        version: string,
        requestBody: ContentItem,
        locale?: string,
        cmsSkipValidation?: boolean,
    ): CancelablePromise<ContentItem> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/experimental/content/{key}/versions/{version}',
            path: {
                'key': key,
                'version': version,
            },
            headers: {
                'cms-skip-validation': cmsSkipValidation,
            },
            query: {
                'locale': locale,
            },
            body: requestBody,
            mediaType: 'application/merge-patch+json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Delete version
     * Deletes the content item with the provided key. If a content item with the provided key does not exist an error is returned. This API is experimental and may change in future releases.
     * @param key
     * @param version
     * @returns ContentItem OK
     * @throws ApiError
     */
    public contentDeleteVersion(
        key: string,
        version: string,
    ): CancelablePromise<ContentItem> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/experimental/content/{key}/versions/{version}',
            path: {
                'key': key,
                'version': version,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
}
