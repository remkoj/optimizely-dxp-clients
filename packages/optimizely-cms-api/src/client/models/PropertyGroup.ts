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
    key: string;
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
};

