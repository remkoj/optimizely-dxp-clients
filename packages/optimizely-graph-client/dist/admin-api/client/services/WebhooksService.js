export class WebhooksService {
    constructor(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * List webhooks
     * List all registered webhooks
     * @returns Webhook Ok
     * @throws ApiError
     */
    listWebhookHandler() {
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
    createWebhookHandler(requestBody) {
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
    deleteWebhookHandler(id) {
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
    updateWebhookHandler(id, requestBody) {
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
//# sourceMappingURL=WebhooksService.js.map