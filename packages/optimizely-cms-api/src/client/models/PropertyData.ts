/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentComponent } from './ContentComponent';
import type { Link } from './Link';
import type { RichText } from './RichText';
/**
 * A single property value for a content item. The value's type and format are determined by the property definition in the content type schema.
 */
export type PropertyData = {
    /**
     * The property value, which can be a string, number, boolean, object, array, or null depending on the property type defined in the content type.
     */
    value?: (string | boolean | number | Link | RichText | ContentComponent | Record<string, any>) | null;
};

