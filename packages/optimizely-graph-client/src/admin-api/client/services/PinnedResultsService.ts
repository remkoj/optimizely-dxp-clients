/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Partial_PinnedCollectionPayload_ } from '../models/Partial_PinnedCollectionPayload_.js';
import type { PinnedCollectionPayload } from '../models/PinnedCollectionPayload.js';
import type { PinnedCollectionResult } from '../models/PinnedCollectionResult.js';
import type { PinnedItemPayload } from '../models/PinnedItemPayload.js';
import type { PinnedItemResult } from '../models/PinnedItemResult.js';
import type { PinnedResultMatchParams } from '../models/PinnedResultMatchParams.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import type { BaseHttpRequest } from '../core/BaseHttpRequest.js';
export class PinnedResultsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get pinned collection(s)
     * Get pinned collections
     * @param page
     * @returns PinnedCollectionResult Ok
     * @throws ApiError
     */
    public listPinnedCollectionHandler(
        page?: number,
    ): CancelablePromise<Array<PinnedCollectionResult>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/pinned/collections',
            query: {
                'page': page,
            },
        });
    }
    /**
     * Register a pinned collection
     * Register a pinned collection
     * @param requestBody
     * @returns PinnedCollectionResult Ok
     * @throws ApiError
     */
    public createPinnedCollectionHandler(
        requestBody: PinnedCollectionPayload,
    ): CancelablePromise<PinnedCollectionResult> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/pinned/collections',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get pinned collection by Id
     * Get collection by Id
     * @param collectionId Pinned collection id
     * @returns PinnedCollectionResult Ok
     * @throws ApiError
     */
    public getPinnedCollectionHandler(
        collectionId: string,
    ): CancelablePromise<PinnedCollectionResult> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/pinned/collections/{collectionId}',
            path: {
                'collectionId': collectionId,
            },
        });
    }
    /**
     * Update a pinned collection
     * Update pinned collection by Id
     * @param collectionId
     * @param requestBody
     * @returns PinnedCollectionResult Ok
     * @throws ApiError
     */
    public updatePinnedCollectionHandler(
        collectionId: string,
        requestBody: Partial_PinnedCollectionPayload_,
    ): CancelablePromise<PinnedCollectionResult> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/pinned/collections/{collectionId}',
            path: {
                'collectionId': collectionId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete a pinned collection
     * Delete pinned collection by Id
     * @param collectionId
     * @returns void
     * @throws ApiError
     */
    public deletePinnedCollectionHandler(
        collectionId: string,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/pinned/collections/{collectionId}',
            path: {
                'collectionId': collectionId,
            },
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
     * Get pinned results
     * Get pinned results by matching phrases
     * @param requestBody
     * @returns PinnedItemResult Ok
     * @throws ApiError
     */
    public matchPinnedItemHandler(
        requestBody: PinnedResultMatchParams,
    ): CancelablePromise<Array<PinnedItemResult>> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/pinned/results',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
