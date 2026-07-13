/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PropertyMappings } from './PropertyMappings';
/**
 * Describes a content source used within CMS.
 */
export type ContentSource = {
    /**
     * The unique identifier (key) of the resource.
     */
    key?: string;
    /**
     * Specifies the type of source. For example 'graph' for a GraphQL content source.
     */
    type: string;
    /**
     * The key of the source that this ContentSource relates to.
     */
    sourceKey: string;
    /**
     * Specifies the source type of this source.
     */
    sourceType: string;
    /**
     * The display name of this ContentSource.
     */
    displayName: string;
    /**
     * A timestamp indicating when this resource was first created.
     */
    readonly created?: string;
    /**
     * The name of the user or application that created this resource.
     */
    readonly createdBy?: string;
    /**
     * Indicates the last time this resource was modified.
     */
    readonly lastModified?: string;
    /**
     * The name of the user or application that last modified this resource.
     */
    readonly lastModifiedBy?: string;
    /**
     * Represents the base of the corresponding content type.
     */
    baseType: ContentSource.baseType;
    propertyMappings: PropertyMappings;
};
export namespace ContentSource {
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

