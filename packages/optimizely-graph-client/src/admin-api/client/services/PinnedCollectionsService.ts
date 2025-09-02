/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PinnedCollectionPayload } from '../models/PinnedCollectionPayload.js';
import type { PinnedCollectionResult } from '../models/PinnedCollectionResult.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import type { BaseHttpRequest } from '../core/BaseHttpRequest.js';
export class PinnedCollectionsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get pinned collection by Id
     * Get collection by Id
     * @param collectionId Pinned collection id
     * @returns PinnedCollectionResult Ok
     * @throws ApiError
     */
    public getByIdPinnedCollectionHandler(
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
        requestBody: PinnedCollectionPayload,
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
     * Delete pinned by Id
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
     * Get pinned collection(s)
     * Get pinned collections
     * @param page
     * @returns PinnedCollectionResult Ok
     * @throws ApiError
     */
    public getPinnedCollectionHandler(
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
}
