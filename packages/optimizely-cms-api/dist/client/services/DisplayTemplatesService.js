"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisplayTemplatesService = void 0;
class DisplayTemplatesService {
    constructor(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * List display templates
     * List display templates using the provided options.
     * @param pageIndex
     * @param pageSize
     * @returns DisplayTemplatePage Success
     * @throws ApiError
     */
    displayTemplatesList(pageIndex, pageSize) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/displaytemplates',
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
     * Create display template
     * Create a new display template.
     * @param requestBody The display template that should be created.
     * @returns DisplayTemplate Success
     * @throws ApiError
     */
    displayTemplatesCreate(requestBody) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/displaytemplates',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Get display template
     * Get the display template with the provided key.
     * @param key The key of the display template to retrieve.
     * @returns DisplayTemplate Success
     * @throws ApiError
     */
    displayTemplatesGet(key) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/displaytemplates/{key}',
            path: {
                'key': key,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Create or replace a display template
     * Create or replace a display template. If a display template with the provided key exist it is replaced.
     * Otherwise a new display template is created.
     * @param key The key of the display template to update or create.
     * @param requestBody The values of the created or replaced display template.
     * @returns DisplayTemplate Success
     * @throws ApiError
     */
    displayTemplatesPut(key, requestBody) {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/displaytemplates/{key}',
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
     * Update display template
     * Update an existing display template.
     * @param key The key of the display template to patch.
     * @param requestBody The values of the display template that should be updated.
     * @returns DisplayTemplate Success
     * @throws ApiError
     */
    displayTemplatesPatch(key, requestBody) {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/displaytemplates/{key}',
            path: {
                'key': key,
            },
            body: requestBody,
            mediaType: 'application/merge-patch+json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Delete display template
     * Deletes the display template with the provided key.
     * @param key The key of the display template to delete.
     * @returns DisplayTemplate Success
     * @throws ApiError
     */
    displayTemplatesDelete(key) {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/displaytemplates/{key}',
            path: {
                'key': key,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
}
exports.DisplayTemplatesService = DisplayTemplatesService;
