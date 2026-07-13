/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 *  Represents a mapping between a property in an external source and its corresponding property in the CMS. Used to define how external properties are mapped to CMS property identifiers and names.
 */
export type PropertyMappingsPatch = {
    /**
     * The key to use for the item in cms. Required if the SourceType is not of type '_Item'.
     */
    displayName?: string | null;
    /**
     * Specifies the format of the source identifier key.
     */
    keyFormat?: string | null;
};

