/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Partial_Record_string_OperationMap__ } from './Partial_Record_string_OperationMap__.js';
import type { Request } from './Request.js';
/**
 * The `WebhookPayload` type represents the payload of a webhook request, which includes information
 * about the request, filters, and whether the webhook is disabled.
 */
export type WebhookPayload = {
    disabled?: boolean;
    request: Request;
    topics?: Array<string>;
    filters?: (Array<Partial_Record_string_OperationMap__> | Partial_Record_string_OperationMap__);
};

