/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Changeset } from '../models/Changeset';
import type { ChangesetItem } from '../models/ChangesetItem';
import type { ChangesetItemPage } from '../models/ChangesetItemPage';
import type { ChangesetPage } from '../models/ChangesetPage';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ChangesetsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List changeset
     * Lists all changeset using the provided options. This API is experimental and may change in future releases.
     * @param sources Indicates which sources should be included when listing changesets.
     * Use Default to include changesets without a specific sources.
     * @param pageIndex
     * @param pageSize
     * @returns ChangesetPage OK
     * @throws ApiError
     */
    public changesetsList(
        sources?: Array<string>,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ChangesetPage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/experimental/changesets',
            query: {
                'sources': sources,
                'pageIndex': pageIndex,
                'pageSize': pageSize,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Create changeset
     * Creates a new changeset. This API is experimental and may change in future releases.
     * @param requestBody The changeset that should be created.
     * @returns Changeset Created
     * @throws ApiError
     */
    public changesetsCreate(
        requestBody: Changeset,
    ): CancelablePromise<Changeset> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/experimental/changesets',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Get changeset
     * Gets the changeset with the provided key. This API is experimental and may change in future releases.
     * @param key The key of the changeset to retrieve.
     * @param ifNoneMatch If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored.
     * @param ifModifiedSince If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided.
     * @returns Changeset OK
     * @throws ApiError
     */
    public changesetsGet(
        key: string,
        ifNoneMatch?: string,
        ifModifiedSince?: string,
    ): CancelablePromise<Changeset> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/experimental/changesets/{key}',
            path: {
                'key': key,
            },
            headers: {
                'If-None-Match': ifNoneMatch,
                'If-Modified-Since': ifModifiedSince,
            },
            errors: {
                304: `Not Modified`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Delete changeset
     * Deletes the changeset with the provided key. If a changeset with the provided key does not exist an error is returned. This API is experimental and may change in future releases.
     * @param key The key of the changeset to delete.
     * @returns Changeset OK
     * @throws ApiError
     */
    public changesetsDelete(
        key: string,
    ): CancelablePromise<Changeset> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/experimental/changesets/{key}',
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
     * Patch changeset
     * Patch an existing changeset. This API is experimental and may change in future releases.
     * @param key The key of the changeset to patch.
     * @param requestBody The values of the changeset that should be patched formatted according to RFC7396.
     * @returns Changeset OK
     * @throws ApiError
     */
    public changesetsPatch(
        key: string,
        requestBody: Changeset,
    ): CancelablePromise<Changeset> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/experimental/changesets/{key}',
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
     * Get changeset item
     * Gets the changeset item for the specified content reference. This API is experimental and may change in future releases.
     * @param changeset The changeset key
     * @param key The content key
     * @param version The content version
     * @returns ChangesetItem OK
     * @throws ApiError
     */
    public changesetsGetItem(
        changeset: string,
        key: string,
        version: string,
    ): CancelablePromise<ChangesetItem> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/experimental/changesets/{changeset}/items/{key}/versions/{version}',
            path: {
                'changeset': changeset,
                'key': key,
                'version': version,
            },
            errors: {
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Patch changeset item
     * Patch the given changeset item. This API is experimental and may change in future releases.
     * @param changeset The changeset key
     * @param key The content key
     * @param version The content version
     * @param requestBody The values of the changeset item that should be patched formatted according to RFC7396.
     * @returns ChangesetItem OK
     * @throws ApiError
     */
    public changesetsPatchItem(
        changeset: string,
        key: string,
        version: string,
        requestBody: ChangesetItem,
    ): CancelablePromise<ChangesetItem> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/experimental/changesets/{changeset}/items/{key}/versions/{version}',
            path: {
                'changeset': changeset,
                'key': key,
                'version': version,
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
     * Delete changeset item
     * Deletes the specified changeset item from the changeset. This API is experimental and may change in future releases.
     * @param changeset The changeset key
     * @param key The content key
     * @param version The content version
     * @returns ChangesetItem OK
     * @throws ApiError
     */
    public changesetsDeleteItem(
        changeset: string,
        key: string,
        version: string,
    ): CancelablePromise<ChangesetItem> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/experimental/changesets/{changeset}/items/{key}/versions/{version}',
            path: {
                'changeset': changeset,
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
    /**
     * List changeset items
     * Lists the available changeset items for the specified changeset using
     * the provided options. This API is experimental and may change in future releases.
     * @param changeset The changeset key
     * @param pageIndex
     * @param pageSize
     * @returns ChangesetItemPage OK
     * @throws ApiError
     */
    public changesetsListItems(
        changeset: string,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ChangesetItemPage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/experimental/changesets/{changeset}/items',
            path: {
                'changeset': changeset,
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
     * Create changeset item
     * Creates the given changeset item. This API is experimental and may change in future releases.
     * @param changeset The changeset key
     * @param requestBody The changeset item
     * @returns ChangesetItem Created
     * @throws ApiError
     */
    public changesetsCreateItem(
        changeset: string,
        requestBody: ChangesetItem,
    ): CancelablePromise<ChangesetItem> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/experimental/changesets/{changeset}/items',
            path: {
                'changeset': changeset,
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
}
