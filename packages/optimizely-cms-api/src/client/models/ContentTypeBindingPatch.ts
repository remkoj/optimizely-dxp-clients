/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PropertyMapping } from './PropertyMapping';
/**
 * Defines the binding between two content types.
 */
export type ContentTypeBindingPatch = {
    /**
     * Specifies the key of the content type that this binding is from.
     */
    from?: string | null;
    /**
     * Specifies the key of the content type that this binding is to.
     */
    to?: string | null;
    /**
     * Object map with all property mappings for this content type binding. The field name represents the path that the property should bind to.
     */
    propertyMappings?: Record<string, PropertyMapping> | null;
};

