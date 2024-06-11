/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OauthToken } from '../models/OauthToken';
import type { OauthTokenRequest } from '../models/OauthTokenRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class OauthService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Request access token
     * Request an access token. This endpoint only supports the 'client_credentials' grant type
     * and will only issue short-lived tokens.
     * @param requestBody
     * @returns OauthToken OK
     * @throws ApiError
     */
    public oauthToken(
        requestBody: OauthTokenRequest,
    ): CancelablePromise<OauthToken> {
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
