import type { Webhook } from '../models/Webhook.js';
import type { WebhookPayload } from '../models/WebhookPayload.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import type { BaseHttpRequest } from '../core/BaseHttpRequest.js';
export declare class WebhooksService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * List webhooks
     * List all registered webhooks
     * @returns Webhook Ok
     * @throws ApiError
     */
    listWebhookHandler(): CancelablePromise<Array<Webhook>>;
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
    createWebhookHandler(requestBody: WebhookPayload): CancelablePromise<void>;
    /**
     * Delete webhook
     * Delete a registered webhook with `id`
     * @param id
     * @returns void
     * @throws ApiError
     */
    deleteWebhookHandler(id: string): CancelablePromise<void>;
    /**
     * Update webhook
     * Update a registered webhook with `id`
     * @param id
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    updateWebhookHandler(id: string, requestBody: WebhookPayload): CancelablePromise<void>;
}
