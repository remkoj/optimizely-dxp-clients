/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Options for approving or rejecting a content version.
 */
export type ApprovalDecisionOptions = {
    /**
     * An optional comment to include with the approval decision. May be required depending on the approval definition configuration.
     */
    comment?: string | null;
    /**
     * Indicates if the approval should be forced, bypassing the normal approval flow. Requires 'admin' access rights.
     */
    force?: boolean;
};

