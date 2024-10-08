/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A writable implementation of an Changeset.
 */
export type Changeset = {
    /**
     * The unique key of this Changeset
     */
    key: string;
    /**
     * The source of this Changeset
     */
    source?: string;
    /**
     * The name of this Changeset.
     */
    displayName: string;
    /**
     * A timestamp indicating when this changeset was first created.
     */
    readonly created?: string;
    /**
     * The username of the user that created this changeset.
     */
    readonly createdBy?: string;
    readonly lastModified?: string;
};

