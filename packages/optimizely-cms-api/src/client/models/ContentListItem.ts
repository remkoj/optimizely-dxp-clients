/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ListPropertyItem } from './ListPropertyItem';
/**
 * Describes a property list item that can hold a content item.
 */
export type ContentListItem = (ListPropertyItem & {
    /**
     * Specifies which content types and base types these property items are allowed to contain.
     */
    allowedTypes?: Array<string>;
    /**
     * Specifies which content types and base types these property items cannot contain.
     */
    restrictedTypes?: Array<string>;
});

