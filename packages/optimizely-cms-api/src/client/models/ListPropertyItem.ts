/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PropertyDataType } from './PropertyDataType';
/**
 * Describes the list item of a ListProperty in the CMS.
 */
export type ListPropertyItem = {
    type: PropertyDataType;
    /**
     * The key of the PropertyFormat that this property item is an instance of.
     */
    format?: string | null;
};

