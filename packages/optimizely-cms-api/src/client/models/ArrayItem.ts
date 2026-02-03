/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EnumerationValue } from './EnumerationValue';
/**
 * Describes the list item of a content type property of type 'array'.
 */
export type ArrayItem = {
    /**
     * Gets the data type for the list item property.
     */
    type?: ArrayItem.type;
    /**
     * The key of the PropertyFormat that this property item is an instance of.
     */
    format?: string | null;
    /**
     * The key of the content type that a property with 'type': 'component' may contain.
     */
    contentType?: string | null;
    /**
     * The minimum value that properties of this type should be able to contain. Value type must match the type of the array item.
     */
    minimum?: (number | null | string | null) | null;
    /**
     * The maximum value that properties of this type should be able to contain. Value type must match the type of the array item.
     */
    maximum?: (number | null | string | null) | null;
    /**
     * The minimum string length that list items of this type should be able to contain.
     */
    minLength?: number | null;
    /**
     * The maximum string length that list items of this type should be able to contain.
     */
    maxLength?: number | null;
    /**
     * Regular expression pattern that limits what strings that list items of this type should be able to contain.
     */
    pattern?: string | null;
    /**
     * A list of possible values that properties of this type should be able to contain.
     */
    enum?: Array<EnumerationValue> | null;
    /**
     * Specifies which content types and base types this property is allowed to contain.
     */
    allowedTypes?: Array<string>;
    /**
     * Specifies which content types and base types this property cannot contain.
     */
    restrictedTypes?: Array<string>;
};
export namespace ArrayItem {
    /**
     * Gets the data type for the list item property.
     */
    export enum type {
        STRING = 'string',
        URL = 'url',
        BOOLEAN = 'boolean',
        INTEGER = 'integer',
        FLOAT = 'float',
        DATE_TIME = 'dateTime',
        CONTENT_REFERENCE = 'contentReference',
        CONTENT = 'content',
        BINARY = 'binary',
        LINK = 'link',
        RICH_TEXT = 'richText',
        JSON = 'json',
        COMPONENT = 'component',
    }
}

