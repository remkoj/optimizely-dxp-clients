/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PropertyMappingsPatch } from './PropertyMappingsPatch';
/**
 * Describes a content source used within CMS.
 */
export type ContentSourcePatch = {
    /**
     * Specifies the type of source. For example 'graph' for a GraphQL content source.
     */
    type?: string | null;
    /**
     * The key of the source that this ContentSource relates to.
     */
    sourceKey?: string | null;
    /**
     * Specifies the source type of this source.
     */
    sourceType?: string | null;
    /**
     * The display name of this ContentSource.
     */
    displayName?: string | null;
    /**
     * Represents the base of the corresponding content type.
     */
    baseType?: ContentSourcePatch.baseType | null;
    propertyMappings?: PropertyMappingsPatch;
};
export namespace ContentSourcePatch {
    /**
     * Represents the base of the corresponding content type.
     */
    export enum baseType {
        _PAGE = '_page',
        _COMPONENT = '_component',
        _MEDIA = '_media',
        _IMAGE = '_image',
        _VIDEO = '_video',
        _FOLDER = '_folder',
        _EXPERIENCE = '_experience',
        _SECTION = '_section',
        _ELEMENT = '_element',
    }
}

