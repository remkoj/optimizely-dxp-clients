/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentTypeProperty } from './ContentTypeProperty';
/**
 * Describes a property that can contain a component instance of a specific type.
 */
export type ComponentProperty = (ContentTypeProperty & {
    /**
     * The key of the ContentType that this ComponentProperty can contain.
     */
    contentType: string;
});

