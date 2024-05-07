"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OauthService = void 0;
class OauthService {
    constructor(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * Request access token
     * Request an access token. This endpoint only supports the 'client_credentials' grant type
     * and will only issue short-lived tokens.
     * @param requestBody
     * @returns OauthToken Success
     * @throws ApiError
     */
    oauthToken(requestBody) {
        return this.httpRequest.request({
            method: 'POST',
            url: '/oauth/token',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
}
exports.OauthService = OauthService;
