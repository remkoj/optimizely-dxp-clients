import type { ContentType } from '../models/ContentType';
import type { ContentTypePage } from '../models/ContentTypePage';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class ContentTypesService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * List content types
     * List content types using the provided options.
     * @param forContainerType Only include types that are available for creation under the provided container type
     * @param sources Indicates which sources should be included when listing content types.
     * Use All to include content types from all sources or
     * Default to include content types without a specific sources.
     * @param pageIndex
     * @param pageSize
     * @returns ContentTypePage Success
     * @throws ApiError
     */
    contentTypesList(forContainerType?: string, sources?: Array<string>, pageIndex?: number, pageSize?: number): CancelablePromise<ContentTypePage>;
    /**
     * Create content type
     * Create a new content type.
     * @param requestBody The content type that should be created.
     * @returns ContentType Success
     * @throws ApiError
     */
    contentTypesCreate(requestBody: ContentType): CancelablePromise<ContentType>;
    /**
     * Get content type
     * Get the content type with the provided key.
     * @param key The key of the content type to retrieve.
     * @returns ContentType Success
     * @throws ApiError
     */
    contentTypesGet(key: string): CancelablePromise<ContentType>;
    /**
     * Create or replace content type
     * Create or replace a content type. If a content type with the provided key exist it is replaced.
     * Otherwise a new content type is created.
     * @param key The key of the content type to update or create.
     * @param requestBody The values of the created or replaced content type.
     * @param ignoreDataLossWarnings Update the content type even though the changes might result in data loss.
     * @returns ContentType Success
     * @throws ApiError
     */
    contentTypesPut(key: string, requestBody: ContentType, ignoreDataLossWarnings?: boolean): CancelablePromise<ContentType>;
    /**
     * Update content type
     * Update an existing content type. If a content type with the provided key does not exist an error is returned.
     * @param key The key of the content type to patch.
     * @param requestBody The values of the content type that should be updated.
     * @param ignoreDataLossWarnings Update the content type even though the changes might result in data loss.
     * @returns ContentType Success
     * @throws ApiError
     */
    contentTypesPatch(key: string, requestBody: ContentType, ignoreDataLossWarnings?: boolean): CancelablePromise<ContentType>;
    /**
     * Delete content type
     * Deletes the content type with the provided key. If a content type with the provided key does not exist an error is returned.
     * @param key The key of the content type to delete.
     * @returns ContentType Success
     * @throws ApiError
     */
    contentTypesDelete(key: string): CancelablePromise<ContentType>;
}
