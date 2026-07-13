/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Options for publishing a content version.
 */
export type PublishContentOptions = {
    /**
     * Gets or sets the date and time at which the content should be published, sets the version into 'scheduled' state if a future date is specified.
     */
    delayUntil?: string | null;
    /**
     * Indicates if validations such as approvals and required properties should be bypassed, requires 'admin' access rights.
     */
    force?: boolean;
};

