/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentTypeProperty } from './ContentTypeProperty';
/**
 * Describes a property that can contain a content item.
 */
export type ContentProperty = (ContentTypeProperty & {
    /**
     * Specifies which content types and base types this property is allowed to contain.
     */
    allowedTypes?: Array<string>;
    /**
     * Specifies which content types and base types this property cannot contain.
     */
    restrictedTypes?: Array<string>;
});

