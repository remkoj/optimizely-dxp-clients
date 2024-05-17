/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Webhook } from '../models/Webhook.js';
import type { WebhookPayload } from '../models/WebhookPayload.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import type { BaseHttpRequest } from '../core/BaseHttpRequest.js';
export class WebhooksService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List webhooks
     * List all registered webhooks
     * @returns Webhook Ok
     * @throws ApiError
     */
    public listWebhookHandler(): CancelablePromise<Array<Webhook>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/webhooks',
        });
    }
    /**
     * Add webhook
     * Register a webhook and listen events respect to filter definition
     *
     * ---
     *
     * _(empty filter): listen all events_
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public createWebhookHandler(
        requestBody: WebhookPayload,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/webhooks',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete webhook
     * Delete a registered webhook with `id`
     * @param id
     * @returns void
     * @throws ApiError
     */
    public deleteWebhookHandler(
        id: string,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/webhooks/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update webhook
     * Update a registered webhook with `id`
     * @param id
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public updateWebhookHandler(
        id: string,
        requestBody: WebhookPayload,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/webhooks/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
