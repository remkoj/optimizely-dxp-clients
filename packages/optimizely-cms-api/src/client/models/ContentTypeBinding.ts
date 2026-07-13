/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PropertyMapping } from './PropertyMapping';
/**
 * Defines the binding between two content types.
 */
export type ContentTypeBinding = {
    /**
     * The unique identifier (key) of the resource.
     */
    key?: string;
    /**
     * Specifies the key of the content type that this binding is from.
     */
    from: string;
    /**
     * Specifies the key of the content type that this binding is to.
     */
    to: string;
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
     * Object map with all property mappings for this content type binding. The field name represents the path that the property should bind to.
     */
    propertyMappings?: Record<string, PropertyMapping>;
};

