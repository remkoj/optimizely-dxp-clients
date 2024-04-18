export class DefinitionV3Service {
    constructor(httpRequest) {
        this.httpRequest = httpRequest;
    }
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
    getContentV3SourceHandler(id) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/content/v3/sources',
            query: {
                'id': id,
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
     * @returns any Source is deleted successfully
     * @throws ApiError
     */
    deleteContentV3SourceHandler(id, mode) {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/content/v3/sources',
            query: {
                'id': id,
                'mode': mode,
            },
            errors: {
                404: `Source is not found`,
            },
        });
    }
    /**
     * Get content types
     * Get content types of the source
     * @param id The id of the source
     * @returns ContentTypeDefinition_V3 Ok
     * @throws ApiError
     */
    getContentV3TypeHandler(id = 'default') {
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
    postContentV3TypeHandler(requestBody, id = 'default') {
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
    putContentV3TypeHandler(requestBody, id = 'default') {
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
//# sourceMappingURL=DefinitionV3Service.js.map