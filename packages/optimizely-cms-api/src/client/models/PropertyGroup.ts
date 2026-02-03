/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Describes a property group of a ContentType in the CMS.
 */
export type PropertyGroup = {
    /**
     * The key that identifies this PropertyGroup.
     */
    key?: string;
    /**
     * The display name of this PropertyGroup.
     */
    displayName?: string;
    /**
     * A string that is used to indicate the source of this PropertyGroup.
     */
    readonly source?: string;
    /**
     * An value that is used to when sorting PropertyGroup instances.
     */
    sortOrder?: number;
    /**
     * A timestamp indicating when this property group was first created.
     */
    readonly created?: string;
    /**
     * The username of the user that created this property group.
     */
    readonly createdBy?: string;
    readonly lastModified?: string;
    /**
     * The username of the user that last modified this property group.
     */
    readonly lastModifiedBy?: string;
};

