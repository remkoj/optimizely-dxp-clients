/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EnumerationValue } from './EnumerationValue';
/**
 * Describes the items of a content type property of type 'array'.
 */
export type ArrayItem = {
    /**
     * The fundamental data type for the items in the array (e.g., string, integer, content reference).
     */
    type: ArrayItem.type;
    /**
     * The property format that defines specialized handling and validation for this array item.
     */
    format?: string;
    /**
     * The content type that items in the array may contain, when the 'type' is set to 'component'.
     */
    contentType?: string;
    /**
     * The minimum value that properties of this type should be able to contain. Value type must match the type of the array item.
     */
    minimum?: (number | null | string | null) | null;
    /**
     * The maximum value that array items of this type should be able to contain. Value type must match the type of the array item.
     */
    maximum?: (number | null | string | null) | null;
    /**
     * The minimum string length that array items of this type should be able to contain.
     */
    minLength?: number | null;
    /**
     * The maximum string length that array items of this type should be able to contain.
     */
    maxLength?: number | null;
    /**
     * Regular expression pattern that limits what strings that array items of this type should be able to contain.
     */
    pattern?: string;
    /**
     * A predefined list of allowed values for array items of this type. The enumeration values must match the property's data type. Allowed for string, integer, float and date-time property types.
     */
    enum?: Array<EnumerationValue> | null;
    /**
     * Defines content and base types that array items of this type may contain.
     */
    allowedTypes?: Array<string>;
    /**
     * Defines content and base types that array items of this type may not contain.
     */
    restrictedTypes?: Array<string>;
    /**
     * Defines editor specific settings for this item. The settings are specific to the item and editor type.
     */
    editorSettings?: Record<string, any> | null;
};
export namespace ArrayItem {
    /**
     * The fundamental data type for the items in the array (e.g., string, integer, content reference).
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
        LINK = 'link',
        RICH_TEXT = 'richText',
        JSON = 'json',
        COMPONENT = 'component',
    }
}

