/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Describes a message from a manifest importing operation.
 */
export type ManifestImportMessage = {
    /**
     * The section where the message originated from.
     */
    section?: string;
    /**
     * The message describing an outcome or error.
     */
    message?: string;
    /**
     * The identifier of the resource that was the reason for this message to be created.
     */
    resource?: string | null;
};

