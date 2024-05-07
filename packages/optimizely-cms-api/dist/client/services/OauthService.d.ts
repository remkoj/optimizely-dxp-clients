import type { OauthToken } from '../models/OauthToken';
import type { OauthTokenRequest } from '../models/OauthTokenRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class OauthService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
    /**
     * Request access token
     * Request an access token. This endpoint only supports the 'client_credentials' grant type
     * and will only issue short-lived tokens.
     * @param requestBody
     * @returns OauthToken Success
     * @throws ApiError
     */
    oauthToken(requestBody: OauthTokenRequest): CancelablePromise<OauthToken>;
}
