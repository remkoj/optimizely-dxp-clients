/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MatchingPinnedSelector } from '../models/MatchingPinnedSelector.js';
import type { PinnedItemPayload } from '../models/PinnedItemPayload.js';
import type { PinnedItemResult } from '../models/PinnedItemResult.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import type { BaseHttpRequest } from '../core/BaseHttpRequest.js';
export class PinnedItemsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get pinned item by id
     * Get single pinned item by id
     * @param collectionId pinned collection id
     * @param id pinned id (id)
     * @returns PinnedItemResult PinnedItemResult
     * @throws ApiError
     */
    public getPinnedItemHandler(
        collectionId: string,
        id: string,
    ): CancelablePromise<PinnedItemResult> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/pinned/collections/{collectionId}/items/{id}',
            path: {
                'collectionId': collectionId,
                'id': id,
            },
        });
    }
    /**
     * Remove pinned item
     * Remove single pinned item
     * @param collectionId pinned collection id
     * @param id pinned id (id)
     * @returns PinnedItemResult Ok
     * @throws ApiError
     */
    public deletePinnedItemHandler(
        collectionId: string,
        id: string,
    ): CancelablePromise<PinnedItemResult> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/pinned/collections/{collectionId}/items/{id}',
            path: {
                'collectionId': collectionId,
                'id': id,
            },
        });
    }
    /**
     * Update a pinned item
     * Update a single pinned item
     * @param collectionId pinned collection id
     * @param id pinned id (id)
     * @param requestBody
     * @returns PinnedItemResult Ok
     * @throws ApiError
     */
    public updatePinnedItemHandler(
        collectionId: string,
        id: string,
        requestBody: PinnedItemPayload,
    ): CancelablePromise<PinnedItemResult> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/pinned/collections/{collectionId}/items/{id}',
            path: {
                'collectionId': collectionId,
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get list of pinned items by collection id
     * Get list of pinned items by given pinned collection id
     * @param collectionId pinned collection id
     * @param limit Limit items
     * @param offset From offset number
     * @param phrase Phrase to be filtered
     * @param sort The sort field, default direction is ASC. Add a minus/dash symbol for DESC (example "-phrase"). Default value created_at DESC.
     * @returns PinnedItemResult Ok
     * @throws ApiError
     */
    public listPinnedItemHandler(
        collectionId: string,
        limit?: number,
        offset?: number,
        phrase?: string,
        sort?: string,
    ): CancelablePromise<Array<PinnedItemResult>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/pinned/collections/{collectionId}/items',
            path: {
                'collectionId': collectionId,
            },
            query: {
                'limit': limit,
                'offset': offset,
                'phrase': phrase,
                'sort': sort,
            },
        });
    }
    /**
     * Clear pinned items in collection
     * Clear pinned items in collection
     * @param collectionId pinned collection id
     * @returns void
     * @throws ApiError
     */
    public clearPinnedItemHandler(
        collectionId: string,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/pinned/collections/{collectionId}/items',
            path: {
                'collectionId': collectionId,
            },
        });
    }
    /**
     * Create a new pinned item
     * Create a new pinned item, collectionId must be created before creating pinned item
     * @param collectionId pinned collection id
     * @param requestBody
     * @returns PinnedItemResult Ok
     * @throws ApiError
     */
    public createPinnedItemHandler(
        collectionId: string,
        requestBody: PinnedItemPayload,
    ): CancelablePromise<PinnedItemResult> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/pinned/collections/{collectionId}/items',
            path: {
                'collectionId': collectionId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get matched pinned by phrases
     * Get matched pinned by phrases
     * @param requestBody MatchingPinnedSelector
     * @returns PinnedItemResult Ok
     * @throws ApiError
     */
    public matchPinnedItemHandler(
        requestBody: MatchingPinnedSelector,
    ): CancelablePromise<Array<PinnedItemResult>> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/pinned/items/match',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
