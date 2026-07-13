/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BestBetCollectionPayload } from '../models/BestBetCollectionPayload.js';
import type { BestBetCollectionResult } from '../models/BestBetCollectionResult.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import type { BaseHttpRequest } from '../core/BaseHttpRequest.js';
export class BestBetsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @deprecated
     * Get bestbet collection(s)
     * Get all bestbet collections or get by Id
     * @param id
     * @param page
     * @returns BestBetCollectionResult Ok
     * @throws ApiError
     */
    public getBestBetCollectionHandler(
        id?: string,
        page?: number,
    ): CancelablePromise<Array<BestBetCollectionResult>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/bestbets/collection',
            query: {
                'id': id,
                'page': page,
            },
        });
    }
    /**
     * @deprecated
     * Register a bestbet collection
     * Register a bestbet collection
     * @param requestBody
     * @returns BestBetCollectionResult Ok
     * @throws ApiError
     */
    public createBestBetCollectionHandler(
        requestBody: BestBetCollectionPayload,
    ): CancelablePromise<BestBetCollectionResult> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/bestbets/collection',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @deprecated
     * Update a bestbet collection
     * Update bestbet collection by Id
     * @param id
     * @param requestBody
     * @returns BestBetCollectionResult Ok
     * @throws ApiError
     */
    public updateBestBetCollectionHandler(
        id: string,
        requestBody: BestBetCollectionPayload,
    ): CancelablePromise<BestBetCollectionResult> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/bestbets/collection/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @deprecated
     * Delete a bestbet collection
     * Delete bestbet by Id
     * @param id
     * @returns void
     * @throws ApiError
     */
    public deleteBestBetCollectionHandler(
        id: string,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/bestbets/collection/{id}',
            path: {
                'id': id,
            },
        });
    }
}
