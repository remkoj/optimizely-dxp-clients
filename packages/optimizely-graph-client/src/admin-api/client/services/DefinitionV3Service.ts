/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentSource_V3 } from '../models/ContentSource_V3.js';
import type { DeleteMode } from '../models/DeleteMode.js';
import type { Slot } from '../models/Slot.js';
import type { SourceInfoMap } from '../models/SourceInfoMap.js';
import type { SourceMetadata } from '../models/SourceMetadata.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import type { BaseHttpRequest } from '../core/BaseHttpRequest.js';
export class DefinitionV3Service {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get source metadata
     * Get `id`, `label`, `description` and `languages` fields of the source
     * @param id The id of the source _(optional)_
     * - _(empty): all sources_
     * - _**default**: only default source_
     * - _**src1**:  only src1_
     * @param slot The slot of the source _(optional)_
     * - _(empty): old slot_
     * - _**new**: new slot_
     * @returns SourceInfoMap Ok
     * @throws ApiError
     */
    public getContentV3SourceHandler(
        id?: string,
        slot?: Slot,
    ): CancelablePromise<SourceInfoMap> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/content/v3/sources',
            query: {
                'id': id,
                'slot': slot,
            },
        });
    }
    /**
     * Delete source
     * Delete content _types / data_ of the source
     * @param id The id of the source
     * - _(empty): all sources_
     * - _**default**: only default source_
     * - _**src1**:  only src1_
     * @param mode Delete mode
     *
     * | mode         | description             | types       | data        |
     * | --           | --                      | --          | --          |
     * | _(empty)_    | _delete types and data_ | _(delete)_  | _(delete)_  |
     * | _**types**_  | _delete only types_     | _(delete)_  |             |
     * | _**data**_   | _delete only data_      |             | _(delete)_  |
     * | _**reset**_  | _reset data_            | _(delete)_  | _(reset)_   |
     * @param slot The slot of the source _(optional)_
     * - _(empty): old slot_
     * - _**new**: new slot_
     * @returns any Source is deleted successfully
     * @throws ApiError
     */
    public deleteContentV3SourceHandler(
        id?: string,
        mode?: DeleteMode,
        slot?: Slot,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/content/v3/sources',
            query: {
                'id': id,
                'mode': mode,
                'slot': slot,
            },
            errors: {
                404: `Source is not found`,
            },
        });
    }
    /**
     * Update source metadata
     * Update `label`, `description` fields of the source
     * @param id The id of the source
     * @param requestBody The new metadata source
     * @param slot The slot of the source _(optional)_
     * - _(empty): old slot_
     * - _**new**: new slot_
     * @returns void
     * @throws ApiError
     */
    public postContentV3SourceHandler(
        id: string,
        requestBody: SourceMetadata,
        slot?: Slot,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/content/v3/sources',
            query: {
                'id': id,
                'slot': slot,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get content types
     * Get content types of the source
     * @param id The id of the source
     * @returns ContentSource_V3 Ok
     * @throws ApiError
     */
    public getContentV3TypeHandler(
        id: string = 'default',
    ): CancelablePromise<ContentSource_V3> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/content/v3/types',
            query: {
                'id': id,
            },
        });
    }
    /**
     * Partial content type update
     * Update content types of the source partially
     * @param requestBody Content type definitions
     * @param id The id of the source
     * @returns void
     * @throws ApiError
     */
    public postContentV3TypeHandler(
        requestBody: ContentSource_V3,
        id: string = 'default',
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/content/v3/types',
            query: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Full content type update
     * Update content types of the source (overwrite all)
     * @param requestBody Content type definitions
     * @param id The id of the source
     * @returns void
     * @throws ApiError
     */
    public putContentV3TypeHandler(
        requestBody: ContentSource_V3,
        id: string = 'default',
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/content/v3/types',
            query: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
