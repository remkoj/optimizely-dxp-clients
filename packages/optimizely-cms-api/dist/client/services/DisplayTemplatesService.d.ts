import type { DisplayTemplate } from '../models/DisplayTemplate';
import type { DisplayTemplatePage } from '../models/DisplayTemplatePage';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class DisplayTemplatesService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * List display templates
     * List display templates using the provided options.
     * @param pageIndex
     * @param pageSize
     * @returns DisplayTemplatePage Success
     * @throws ApiError
     */
    displayTemplatesList(pageIndex?: number, pageSize?: number): CancelablePromise<DisplayTemplatePage>;
    /**
     * Create display template
     * Create a new display template.
     * @param requestBody The display template that should be created.
     * @returns DisplayTemplate Success
     * @throws ApiError
     */
    displayTemplatesCreate(requestBody: DisplayTemplate): CancelablePromise<DisplayTemplate>;
    /**
     * Get display template
     * Get the display template with the provided key.
     * @param key The key of the display template to retrieve.
     * @returns DisplayTemplate Success
     * @throws ApiError
     */
    displayTemplatesGet(key: string): CancelablePromise<DisplayTemplate>;
    /**
     * Create or replace a display template
     * Create or replace a display template. If a display template with the provided key exist it is replaced.
     * Otherwise a new display template is created.
     * @param key The key of the display template to update or create.
     * @param requestBody The values of the created or replaced display template.
     * @returns DisplayTemplate Success
     * @throws ApiError
     */
    displayTemplatesPut(key: string, requestBody: DisplayTemplate): CancelablePromise<DisplayTemplate>;
    /**
     * Update display template
     * Update an existing display template.
     * @param key The key of the display template to patch.
     * @param requestBody The values of the display template that should be updated.
     * @returns DisplayTemplate Success
     * @throws ApiError
     */
    displayTemplatesPatch(key: string, requestBody: DisplayTemplate): CancelablePromise<DisplayTemplate>;
    /**
     * Delete display template
     * Deletes the display template with the provided key.
     * @param key The key of the display template to delete.
     * @returns DisplayTemplate Success
     * @throws ApiError
     */
    displayTemplatesDelete(key: string): CancelablePromise<DisplayTemplate>;
}
