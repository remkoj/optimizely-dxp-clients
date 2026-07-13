/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Identifies a user, role or application that can be assigned access associated with a resource.
 */
export type SecurityIdentity = {
    /**
     * The unique name of the user, role or application that this identifier references.
     */
    name: string;
    /**
     * The type of the security entity that this identifier references. Will default to 'role' if not specified.
     */
    type?: SecurityIdentity.type;
};
export namespace SecurityIdentity {
    /**
     * The type of the security entity that this identifier references. Will default to 'role' if not specified.
     */
    export enum type {
        USER = 'user',
        ROLE = 'role',
        APPLICATION = 'application',
    }
}

