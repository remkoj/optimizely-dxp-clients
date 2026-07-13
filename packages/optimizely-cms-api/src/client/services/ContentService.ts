/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApprovalDecisionOptions } from '../models/ApprovalDecisionOptions';
import type { ContentNode } from '../models/ContentNode';
import type { ContentNodePage } from '../models/ContentNodePage';
import type { ContentNodePatch } from '../models/ContentNodePatch';
import type { ContentVersion } from '../models/ContentVersion';
import type { ContentVersionPage } from '../models/ContentVersionPage';
import type { ContentVersionPatch } from '../models/ContentVersionPatch';
import type { CopyContentOptions } from '../models/CopyContentOptions';
import type { NewContent } from '../models/NewContent';
import type { NewContentNode } from '../models/NewContentNode';
import type { PreviewPage } from '../models/PreviewPage';
import type { PublishContentOptions } from '../models/PublishContentOptions';
import type { ReadyContentOptions } from '../models/ReadyContentOptions';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ContentService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Create content
     * Create a new content item.
     * @param requestBody The content item that should be created.
     * @param cmsSkipValidation Indicates which content validation rules should be bypassed. Supported values are '*' (skip all validations), 'data' (skip data validation), and 'references' (skip reference validation). Values can be combined, empty or duplicated values are ignored, and any unknown values result in a validation error. Use with caution as this may allow creation of invalid content that could cause issues in production.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @returns NewContentNode Created
     * @throws ApiError
     */
    public contentCreate(
        requestBody: NewContent,
        cmsSkipValidation?: Array<'*' | 'data' | 'references'>,
        prefer?: Array<string>,
    ): CancelablePromise<NewContentNode> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/content',
            headers: {
                'cms-skip-validation': cmsSkipValidation,
                'Prefer': prefer,
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
    /**
     * Copy content
     * Create a copy of the content item with the provided key.
     * @param key The key of the content item to copy.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @param cmsAcceptResource Indicates if the client accepts alternative response content in cases when the primary resource is unavailable. Empty and duplicated values are ignored. The order of values is ignored; When both are accepted, inherited resources take precedence over deleted resources. Unknown values are considered invalid.
     * @param requestBody Optional instructions for how to copy content.
     * @returns ContentNode Created
     * @throws ApiError
     */
    public contentCopy(
        key: string,
        prefer?: Array<string>,
        cmsAcceptResource?: Array<'*' | 'inherited' | 'deleted'>,
        requestBody?: CopyContentOptions,
    ): CancelablePromise<ContentNode> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/content/{key}:copy',
            path: {
                'key': key,
            },
            headers: {
                'Prefer': prefer,
                'cms-accept-resource': cmsAcceptResource,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Restore content
     * Restore the deleted content item with the provided key. If a content item with the provided key is not deleted an error is returned.
     * @param key The key of the content item to undelete.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @returns ContentNode OK
     * @throws ApiError
     */
    public contentUndelete(
        key: string,
        prefer?: Array<string>,
    ): CancelablePromise<ContentNode> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/content/{key}:undelete',
            path: {
                'key': key,
            },
            headers: {
                'Prefer': prefer,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get content node
     * Get content node with the provided key.
     * @param key The key of the content to retrieve the node for.
     * @param cmsAcceptResource Indicates if the client accepts alternative response content in cases when the primary resource is unavailable. Empty and duplicated values are ignored. The order of values is ignored; When both are accepted, inherited resources take precedence over deleted resources. Unknown values are considered invalid.
     * @param ifNoneMatch If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored.
     * @param ifModifiedSince If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided.
     * @returns ContentNode OK
     * @throws ApiError
     */
    public contentGetNode(
        key: string,
        cmsAcceptResource?: Array<'*' | 'inherited' | 'deleted'>,
        ifNoneMatch?: string,
        ifModifiedSince?: string,
    ): CancelablePromise<ContentNode> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/content/{key}',
            path: {
                'key': key,
            },
            headers: {
                'cms-accept-resource': cmsAcceptResource,
                'If-None-Match': ifNoneMatch,
                'If-Modified-Since': ifModifiedSince,
            },
            errors: {
                304: `Not Modified`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Patch content
     * Patch an existing content item. If a content item with the provided key does not exist an error is returned.
     * @param key The key of the content item to patch.
     * @param requestBody The values of the content item that should be patched.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @param ifMatch If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @returns ContentNode OK
     * @throws ApiError
     */
    public contentPatchNode(
        key: string,
        requestBody: ContentNodePatch,
        prefer?: Array<string>,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
    ): CancelablePromise<ContentNode> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/content/{key}',
            path: {
                'key': key,
            },
            headers: {
                'Prefer': prefer,
                'If-Match': ifMatch,
                'If-Unmodified-Since': ifUnmodifiedSince,
            },
            body: requestBody,
            mediaType: 'application/merge-patch+json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                412: `Precondition Failed`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete content
     * Deletes the content item with the provided key. If a content item with the provided key does not exist an error is returned.
     * @param key The key of the content item to delete.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @param cmsPermanentDelete Indicates that the content item should be permanently deleted immediately or if it should be soft deleted first.
     * @param ifMatch If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @returns ContentNode OK
     * @throws ApiError
     */
    public contentDelete(
        key: string,
        prefer?: Array<string>,
        cmsPermanentDelete?: boolean,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
    ): CancelablePromise<ContentNode> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/content/{key}',
            path: {
                'key': key,
            },
            headers: {
                'Prefer': prefer,
                'cms-permanent-delete': cmsPermanentDelete,
                'If-Match': ifMatch,
                'If-Unmodified-Since': ifUnmodifiedSince,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                412: `Precondition Failed`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * List assets
     * List the assets that belongs to a content instance.
     * @param key The key of the content to retrieve assets for.
     * @param contentTypes Indicates which content types or base types to include in the list.
     * @param pageIndex Zero based index of the page that should be retrieved.
     * @param pageSize The maximum items per page that should be retrieved.
     * @returns ContentNodePage OK
     * @throws ApiError
     */
    public contentListAssets(
        key: string,
        contentTypes?: Array<string>,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ContentNodePage> {
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
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * List content in container
     * List the content items located in a specific container.
     * @param key The key of the content to retrieve items for.
     * @param contentTypes Indicates which content types or base types to include in the list.
     * @param pageIndex Zero based index of the page that should be retrieved.
     * @param pageSize The maximum items per page that should be retrieved.
     * @returns ContentNodePage OK
     * @throws ApiError
     */
    public contentListItems(
        key: string,
        contentTypes?: Array<string>,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ContentNodePage> {
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
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * List locale versions
     * List versions of the content with the provided key and locale.
     * @param key The key of the content item for which versions should be listed.
     * @param locale The locale of the content item for which versions should be listed.
     * @param pageIndex Zero based index of the page that should be retrieved.
     * @param pageSize The maximum items per page that should be retrieved.
     * @returns ContentVersionPage OK
     * @throws ApiError
     */
    public contentListLocaleVersions(
        key: string,
        locale: string,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ContentVersionPage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/content/{key}/locales/{locale}',
            path: {
                'key': key,
                'locale': locale,
            },
            query: {
                'pageIndex': pageIndex,
                'pageSize': pageSize,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete locale
     * Deletes a branch of the content with the provided key and locale. Returns the published or latest content item in the locale that was deleted. If a content item with the provided key does not exist an error is returned.
     * @param key The key of the content item that should be deleted.
     * @param locale The locale that should be deleted for the content item.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @returns ContentVersion OK
     * @throws ApiError
     */
    public contentDeleteLocale(
        key: string,
        locale: string,
        prefer?: Array<string>,
    ): CancelablePromise<ContentVersion> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/content/{key}/locales/{locale}',
            path: {
                'key': key,
                'locale': locale,
            },
            headers: {
                'Prefer': prefer,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get content path
     * Get the content path with the provided key.
     * @param key The key of the content path to retrieve.
     * @param pageIndex Zero based index of the page that should be retrieved.
     * @param pageSize The maximum items per page that should be retrieved.
     * @returns ContentNodePage OK
     * @throws ApiError
     */
    public contentGetPath(
        key: string,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ContentNodePage> {
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
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * List versions
     * List versions of the content item with the provided key and the provided options.
     * @param key The key of the content item for which versions should be listed.
     * @param locales Optional list of locales that should be included. Locale must be a valid IETF BCP-47 language tag. Use 'NEUTRAL' to include locale-neutral content.
     * @param statuses Optional list of status values that versions must have one of to be included.
     * @param pageIndex Zero based index of the page that should be retrieved.
     * @param pageSize The maximum items per page that should be retrieved.
     * @returns ContentVersionPage OK
     * @throws ApiError
     */
    public contentListVersions(
        key: string,
        locales?: Array<string>,
        statuses?: Array<'draft' | 'ready' | 'published' | 'previous' | 'scheduled' | 'rejected' | 'inReview'>,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ContentVersionPage> {
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
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Create version
     * Create a new version of a content item.
     * @param key The key of the content item for which a new content version should be created.
     * @param requestBody The content version that should be created.
     * @param cmsSkipValidation Indicates which content validation rules should be bypassed. Supported values are '*' (skip all validations), 'data' (skip data validation), and 'references' (skip reference validation). Values can be combined, empty or duplicated values are ignored, and any unknown values result in a validation error. Use with caution as this may allow creation of invalid content that could cause issues in production.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @returns ContentVersion Created
     * @throws ApiError
     */
    public contentCreateVersion(
        key: string,
        requestBody: ContentVersion,
        cmsSkipValidation?: Array<'*' | 'data' | 'references'>,
        prefer?: Array<string>,
    ): CancelablePromise<ContentVersion> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/content/{key}/versions',
            path: {
                'key': key,
            },
            headers: {
                'cms-skip-validation': cmsSkipValidation,
                'Prefer': prefer,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Approve the active step of an approval for a content version that is in review. For multi-step approvals, the version remains in review until all steps are approved.
     * @param key The key of the content item.
     * @param version The version of the content item.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @param ifMatch If provided, the POST request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the POST request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @param requestBody Options for the approval decision. Use 'force' to bypass the normal approval flow (requires admin access).
     * @returns ContentVersion OK
     * @throws ApiError
     */
    public contentApprove(
        key: string,
        version: string,
        prefer?: Array<string>,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
        requestBody?: ApprovalDecisionOptions,
    ): CancelablePromise<ContentVersion> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/content/{key}/versions/{version}:approve',
            path: {
                'key': key,
                'version': version,
            },
            headers: {
                'Prefer': prefer,
                'If-Match': ifMatch,
                'If-Unmodified-Since': ifUnmodifiedSince,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                412: `Precondition Failed`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Change content version into draft status.
     * @param key The key of the content item.
     * @param version The version of the content item.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @param ifMatch If provided, the POST request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the POST request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @returns ContentVersion OK
     * @throws ApiError
     */
    public contentDraft(
        key: string,
        version: string,
        prefer?: Array<string>,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
    ): CancelablePromise<ContentVersion> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/content/{key}/versions/{version}:draft',
            path: {
                'key': key,
                'version': version,
            },
            headers: {
                'Prefer': prefer,
                'If-Match': ifMatch,
                'If-Unmodified-Since': ifUnmodifiedSince,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                412: `Precondition Failed`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Publish content version
     * @param key The key of the content item to publish.
     * @param version The version of the content item to publish.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @param ifMatch If provided, the POST request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the POST request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @param requestBody Optional instructions for how to publish content.
     * @returns ContentVersion OK
     * @throws ApiError
     */
    public contentPublish(
        key: string,
        version: string,
        prefer?: Array<string>,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
        requestBody?: PublishContentOptions,
    ): CancelablePromise<ContentVersion> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/content/{key}/versions/{version}:publish',
            path: {
                'key': key,
                'version': version,
            },
            headers: {
                'Prefer': prefer,
                'If-Match': ifMatch,
                'If-Unmodified-Since': ifUnmodifiedSince,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                412: `Precondition Failed`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Make content ready to publish, if approvals are required the version will automatically be moved to in review.
     * @param key The key of the content item.
     * @param version The version of the content item.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @param ifMatch If provided, the POST request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the POST request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @param requestBody Optional instructions such as a comment for the approval.
     * @returns ContentVersion OK
     * @throws ApiError
     */
    public contentReady(
        key: string,
        version: string,
        prefer?: Array<string>,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
        requestBody?: ReadyContentOptions,
    ): CancelablePromise<ContentVersion> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/content/{key}/versions/{version}:ready',
            path: {
                'key': key,
                'version': version,
            },
            headers: {
                'Prefer': prefer,
                'If-Match': ifMatch,
                'If-Unmodified-Since': ifUnmodifiedSince,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                412: `Precondition Failed`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Reject a content version that is in review. The version transitions to rejected status regardless of remaining approval steps.
     * @param key The key of the content item.
     * @param version The version of the content item.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @param ifMatch If provided, the POST request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the POST request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @param requestBody Options for the rejection decision. Use 'force' to bypass the normal approval flow (requires admin access).
     * @returns ContentVersion OK
     * @throws ApiError
     */
    public contentReject(
        key: string,
        version: string,
        prefer?: Array<string>,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
        requestBody?: ApprovalDecisionOptions,
    ): CancelablePromise<ContentVersion> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/content/{key}/versions/{version}:reject',
            path: {
                'key': key,
                'version': version,
            },
            headers: {
                'Prefer': prefer,
                'If-Match': ifMatch,
                'If-Unmodified-Since': ifUnmodifiedSince,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                412: `Precondition Failed`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get version
     * Get the content item with the provided key and version.
     * @param key
     * @param version
     * @param ifNoneMatch If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored.
     * @param ifModifiedSince If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided.
     * @returns ContentVersion OK
     * @throws ApiError
     */
    public contentGetVersion(
        key: string,
        version: string,
        ifNoneMatch?: string,
        ifModifiedSince?: string,
    ): CancelablePromise<ContentVersion> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/content/{key}/versions/{version}',
            path: {
                'key': key,
                'version': version,
            },
            headers: {
                'If-None-Match': ifNoneMatch,
                'If-Modified-Since': ifModifiedSince,
            },
            errors: {
                304: `Not Modified`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Patch version
     * Patch an existing content item and returns the updated content item. If a content item with the provided key does not exist an error is returned.
     * @param key The key of the content item that should be patched.
     * @param version The version of the content item that should be patched.
     * @param requestBody The content information that should be patched.
     * @param cmsSkipValidation Indicates which content validation rules should be bypassed. Supported values are '*' (skip all validations), 'data' (skip data validation), and 'references' (skip reference validation). Values can be combined, empty or duplicated values are ignored, and any unknown values result in a validation error. Use with caution as this may allow creation of invalid content that could cause issues in production.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @param ifMatch If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @returns ContentVersion OK
     * @throws ApiError
     */
    public contentPatchVersion(
        key: string,
        version: string,
        requestBody: ContentVersionPatch,
        cmsSkipValidation?: Array<'*' | 'data' | 'references'>,
        prefer?: Array<string>,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
    ): CancelablePromise<ContentVersion> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/content/{key}/versions/{version}',
            path: {
                'key': key,
                'version': version,
            },
            headers: {
                'cms-skip-validation': cmsSkipValidation,
                'Prefer': prefer,
                'If-Match': ifMatch,
                'If-Unmodified-Since': ifUnmodifiedSince,
            },
            body: requestBody,
            mediaType: 'application/merge-patch+json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                412: `Precondition Failed`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete version
     * Deletes the content item with the provided key and version and returns the deleted item. If a content item with the provided key does not exist an error is returned.
     * @param key The key of the content item that should be deleted.
     * @param version The version of the content item that should be deleted.
     * @param prefer Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
     * @param ifMatch If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored.
     * @param ifUnmodifiedSince If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided.
     * @returns ContentVersion OK
     * @throws ApiError
     */
    public contentDeleteVersion(
        key: string,
        version: string,
        prefer?: Array<string>,
        ifMatch?: string,
        ifUnmodifiedSince?: string,
    ): CancelablePromise<ContentVersion> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/content/{key}/versions/{version}',
            path: {
                'key': key,
                'version': version,
            },
            headers: {
                'Prefer': prefer,
                'If-Match': ifMatch,
                'If-Unmodified-Since': ifUnmodifiedSince,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                412: `Precondition Failed`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Download content media file.
     * Download the media file for a specific content item version.
     * @param key The key of the content item.
     * @param version The version of the content item.
     * @returns any OK
     * @throws ApiError
     */
    public contentGetMedia(
        key: string,
        version: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/content/{key}/versions/{version}/media',
            path: {
                'key': key,
                'version': version,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get preview URLs for a content item version.
     * Generate preview URLs for the content item with fresh authentication tokens.
     * @param key The key of the content item.
     * @param version The version of the content item.
     * @param pageIndex Zero based index of the page that should be retrieved.
     * @param pageSize The maximum items per page that should be retrieved.
     * @returns PreviewPage OK
     * @throws ApiError
     */
    public contentGetPreviews(
        key: string,
        version: string,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<PreviewPage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/content/{key}/versions/{version}/previews',
            path: {
                'key': key,
                'version': version,
            },
            query: {
                'pageIndex': pageIndex,
                'pageSize': pageSize,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Query versions
     * List content versions based on the provided query options.
     * @param locales Optional list of locales that should be included. Locale must be a valid IETF BCP-47 language tag. Use 'NEUTRAL' to include locale-neutral content.
     * @param statuses Optional list of status values that versions must have one of to be included.
     * @param pageIndex Zero based index of the page that should be retrieved.
     * @param pageSize The maximum items per page that should be retrieved.
     * @returns ContentVersionPage OK
     * @throws ApiError
     */
    public contentListAllVersions(
        locales?: Array<string>,
        statuses?: Array<'draft' | 'ready' | 'published' | 'previous' | 'scheduled' | 'rejected' | 'inReview'>,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ContentVersionPage> {
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
                401: `Unauthorized`,
                403: `Forbidden`,
                429: `Too Many Requests`,
                500: `Internal Server Error`,
            },
        });
    }
}
