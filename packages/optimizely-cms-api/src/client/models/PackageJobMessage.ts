/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Describes a status message from a package job.
 */
export type PackageJobMessage = {
    /**
     * The section where the message originated from.
     */
    readonly section?: string;
    /**
     * The message describing an outcome.
     */
    readonly message?: string;
    /**
     * The identifier of the resource that was the reason for this message to be created.
     */
    readonly identifier?: string | null;
};

