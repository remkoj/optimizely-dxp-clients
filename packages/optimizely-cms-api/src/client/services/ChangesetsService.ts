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
     * Lists all changeset using the provided options.
     * @param pageIndex
     * @param pageSize
     * @returns ChangesetPage Success
     * @throws ApiError
     */
    public changesetsList(
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ChangesetPage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/changesets',
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
     * Create changeset
     * Creates a new changeset.
     * @param requestBody The changeset that should be created.
     * @returns Changeset Success
     * @throws ApiError
     */
    public changesetsCreate(
        requestBody: Changeset,
    ): CancelablePromise<Changeset> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/changesets',
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
     * Gets the changeset with the provided key.
     * @param key The key of the changeset to retrieve.
     * @returns Changeset Success
     * @throws ApiError
     */
    public changesetsGet(
        key: string,
    ): CancelablePromise<Changeset> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/changesets/{key}',
            path: {
                'key': key,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Delete changeset
     * Deletes the changeset with the provided key. If a changeset with the provided key does not exist an error is returned.
     * @param key The key of the changeset to delete.
     * @returns Changeset Success
     * @throws ApiError
     */
    public changesetsDelete(
        key: string,
    ): CancelablePromise<Changeset> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/changesets/{key}',
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
     * Create or replace changeset
     * Creates or replaces a changeset. If a changeset with the provided key exist it is replaced.
     * Otherwise a new changeset is created.
     * @param key The key of the changeset to update or create.
     * @param requestBody The values of the created or replaced changeset.
     * @returns Changeset Success
     * @throws ApiError
     */
    public changesetsPut(
        key: string,
        requestBody: Changeset,
    ): CancelablePromise<Changeset> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/changesets/{key}',
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
     * Get changeset item
     * Gets the changeset item for the specified content reference.
     * @param changeset The changeset key
     * @param key The content key
     * @param version The content version
     * @returns ChangesetItem Success
     * @throws ApiError
     */
    public changesetsGetItem(
        changeset: string,
        key: string,
        version: string,
    ): CancelablePromise<ChangesetItem> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/changesets/{changeset}/items/{key}/versions/{version}',
            path: {
                'changeset': changeset,
                'key': key,
                'version': version,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Delete changeset item
     * Deletes the specified changeset item from the changeset.
     * @param changeset The changeset key
     * @param key The content key
     * @param version The content version
     * @returns ChangesetItem Success
     * @throws ApiError
     */
    public changesetsDeleteItem(
        changeset: string,
        key: string,
        version: string,
    ): CancelablePromise<ChangesetItem> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/changesets/{changeset}/items/{key}/versions/{version}',
            path: {
                'changeset': changeset,
                'key': key,
                'version': version,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * List changeset items
     * Lists the available changeset items for the specified changeset using
     * the provided options.
     * @param changeset The changeset key
     * @param pageIndex
     * @param pageSize
     * @returns ChangesetItemPage Success
     * @throws ApiError
     */
    public changesetsListItems(
        changeset: string,
        pageIndex?: number,
        pageSize?: number,
    ): CancelablePromise<ChangesetItemPage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/changesets/{changeset}/items',
            path: {
                'changeset': changeset,
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
     * Create changeset item
     * Creates the given changeset item.
     * @param changeset The changeset key
     * @param requestBody The changeset item
     * @returns ChangesetItem Success
     * @throws ApiError
     */
    public changesetsCreateItem(
        changeset: string,
        requestBody: ChangesetItem,
    ): CancelablePromise<ChangesetItem> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/changesets/{changeset}/items',
            path: {
                'changeset': changeset,
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
     * Update changeset item
     * Updates the given changeset item.
     * @param changeset The changeset key
     * @param contentKey The content key
     * @param contentVersion The content version
     * @param requestBody The changeset item
     * @param allowCreate Indicates if a new changeset item should be created if it does not exist
     * @returns ChangesetItem Success
     * @throws ApiError
     */
    public changesetsUpdateItem(
        changeset: string,
        contentKey: string,
        contentVersion: string,
        requestBody: ChangesetItem,
        allowCreate?: boolean,
    ): CancelablePromise<ChangesetItem> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/changesets/{changeset}/items/{contentKey}/versions/{contentVersion}',
            path: {
                'changeset': changeset,
                'contentKey': contentKey,
                'contentVersion': contentVersion,
            },
            query: {
                'allowCreate': allowCreate,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
}
