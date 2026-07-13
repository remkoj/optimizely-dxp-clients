/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentBinding } from './ContentBinding';
import type { PropertyData } from './PropertyData';
/**
 * Base structure for content data. Contains properties defined by the content type and optional bindings to source content. Property values must conform to the types defined in the associated ContentType definition.
 */
export type ContentData = {
    binding?: ContentBinding;
    /**
     * Properties as they are defined by corresponding component or content type.
     */
    properties?: Record<string, PropertyData>;
};

