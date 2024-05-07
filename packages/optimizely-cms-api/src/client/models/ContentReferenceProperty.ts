/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentTypeProperty } from './ContentTypeProperty';
/**
 * Describes a property that can contain a reference to a content item.
 */
export type ContentReferenceProperty = (ContentTypeProperty & {
    /**
     * Specifies which content types and base types this property is allowed to reference.
     */
    allowedTypes?: Array<string>;
    /**
     * Specifies which content types and base types this property is restricted from referencing.
     */
    restrictedTypes?: Array<string>;
});

