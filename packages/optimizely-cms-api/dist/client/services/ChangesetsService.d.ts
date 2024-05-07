import type { Changeset } from '../models/Changeset';
import type { ChangesetItem } from '../models/ChangesetItem';
import type { ChangesetItemPage } from '../models/ChangesetItemPage';
import type { ChangesetPage } from '../models/ChangesetPage';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class ChangesetsService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * List changeset
     * Lists all changeset using the provided options.
     * @param pageIndex
     * @param pageSize
     * @returns ChangesetPage Success
     * @throws ApiError
     */
    changesetsList(pageIndex?: number, pageSize?: number): CancelablePromise<ChangesetPage>;
    /**
     * Create changeset
     * Creates a new changeset.
     * @param requestBody The changeset that should be created.
     * @returns Changeset Success
     * @throws ApiError
     */
    changesetsCreate(requestBody: Changeset): CancelablePromise<Changeset>;
    /**
     * Get changeset
     * Gets the changeset with the provided key.
     * @param key The key of the changeset to retrieve.
     * @returns Changeset Success
     * @throws ApiError
     */
    changesetsGet(key: string): CancelablePromise<Changeset>;
    /**
     * Delete changeset
     * Deletes the changeset with the provided key. If a changeset with the provided key does not exist an error is returned.
     * @param key The key of the changeset to delete.
     * @returns Changeset Success
     * @throws ApiError
     */
    changesetsDelete(key: string): CancelablePromise<Changeset>;
    /**
     * Create or replace changeset
     * Creates or replaces a changeset. If a changeset with the provided key exist it is replaced.
     * Otherwise a new changeset is created.
     * @param key The key of the changeset to update or create.
     * @param requestBody The values of the created or replaced changeset.
     * @returns Changeset Success
     * @throws ApiError
     */
    changesetsPut(key: string, requestBody: Changeset): CancelablePromise<Changeset>;
    /**
     * Get changeset item
     * Gets the changeset item for the specified content reference.
     * @param changeset The changeset key
     * @param key The content key
     * @param version The content version
     * @returns ChangesetItem Success
     * @throws ApiError
     */
    changesetsGetItem(changeset: string, key: string, version: string): CancelablePromise<ChangesetItem>;
    /**
     * Delete changeset item
     * Deletes the specified changeset item from the changeset.
     * @param changeset The changeset key
     * @param key The content key
     * @param version The content version
     * @returns ChangesetItem Success
     * @throws ApiError
     */
    changesetsDeleteItem(changeset: string, key: string, version: string): CancelablePromise<ChangesetItem>;
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
    changesetsListItems(changeset: string, pageIndex?: number, pageSize?: number): CancelablePromise<ChangesetItemPage>;
    /**
     * Create changeset item
     * Creates the given changeset item.
     * @param changeset The changeset key
     * @param requestBody The changeset item
     * @returns ChangesetItem Success
     * @throws ApiError
     */
    changesetsCreateItem(changeset: string, requestBody: ChangesetItem): CancelablePromise<ChangesetItem>;
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
    changesetsUpdateItem(changeset: string, contentKey: string, contentVersion: string, requestBody: ChangesetItem, allowCreate?: boolean): CancelablePromise<ChangesetItem>;
}
