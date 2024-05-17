import type { ContentTypeDefinition_V3 } from '../models/ContentTypeDefinition_V3.js';
import type { DeleteMode } from '../models/DeleteMode.js';
import type { SourceInfoMap } from '../models/SourceInfoMap.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import type { BaseHttpRequest } from '../core/BaseHttpRequest.js';
export declare class DefinitionV3Service {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * Get source metadata
     * Get `id`, `label` and `languages` fields of the source
     * @param id The id of the source _(optional)_
     * - _(empty): all sources_
     * - _**default**: only default source_
     * - _**src1**:  only src1_
     * @returns SourceInfoMap Ok
     * @throws ApiError
     */
    getContentV3SourceHandler(id?: string): CancelablePromise<SourceInfoMap>;
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
     * @returns any Source is deleted successfully
     * @throws ApiError
     */
    deleteContentV3SourceHandler(id?: string, mode?: DeleteMode): CancelablePromise<any>;
    /**
     * Get content types
     * Get content types of the source
     * @param id The id of the source
     * @returns ContentTypeDefinition_V3 Ok
     * @throws ApiError
     */
    getContentV3TypeHandler(id?: string): CancelablePromise<ContentTypeDefinition_V3>;
    /**
     * Partial content type update
     * Update content types of the source partially
     * @param requestBody Content type definitions
     * @param id The id of the source
     * @returns void
     * @throws ApiError
     */
    postContentV3TypeHandler(requestBody: ContentTypeDefinition_V3, id?: string): CancelablePromise<void>;
    /**
     * Full content type update
     * Update content types of the source (overwrite all)
     * @param requestBody Content type definitions
     * @param id The id of the source
     * @returns void
     * @throws ApiError
     */
    putContentV3TypeHandler(requestBody: ContentTypeDefinition_V3, id?: string): CancelablePromise<void>;
}
