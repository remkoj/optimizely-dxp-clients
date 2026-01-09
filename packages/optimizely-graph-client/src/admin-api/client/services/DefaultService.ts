/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Response } from '../models/Response.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import type { BaseHttpRequest } from '../core/BaseHttpRequest.js';
export class DefaultService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @returns Response Ok
     * @throws ApiError
     */
    public postFxEventHandler(): CancelablePromise<Response> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/events/fx',
        });
    }
}
