/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentTypeProperty } from './ContentTypeProperty';
/**
 * Describes a property that can contain a reference to a content item.
 */
export type ContentReferenceProperty = (ContentTypeProperty & {
    allowedTypes?: Array<string>;
    restrictedTypes?: Array<string>;
});

