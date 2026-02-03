/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ArrayItem } from './ArrayItem';
import type { EnumerationValue } from './EnumerationValue';
import type { ImageDescriptor } from './ImageDescriptor';
/**
 * Describes a property of a ContentType in the CMS.
 */
export type ContentTypeProperty = {
    /**
     * Gets the data type for the property.
     */
    type?: ContentTypeProperty.type;
    /**
     * The key of the PropertyFormat that this ContentTypeProperty is an instance of.
     */
    format?: string | null;
    /**
     * The key of the content type that a property with 'type': 'component' may contain.
     */
    contentType?: string | null;
    /**
     * The display name of this ContentTypeProperty.
     */
    displayName?: string;
    /**
     * A description of this ContentTypeProperty.
     */
    description?: string;
    /**
     * Indicates if a property instance of this type should be localized for each locale
     * or if values are shared between all locales.
     */
    localized?: boolean;
    /**
     * Indicates if a property instance of this type must always be assigned a value.
     */
    required?: boolean;
    /**
     * A reference to the PropertyGroup that this ContentTypeProperty is part of.
     * If this value is empty, a group may be assigned by the system.
     */
    group?: string;
    /**
     * An value that is used to when sorting ContentTypeProperty instances.
     */
    sortOrder?: number;
    /**
     * Indicates how should this property will be indexed in the search engine.
     * If this value is not explicitly set, the property will be indexed using default indexing setting of the search engine.
     */
    indexingType?: ContentTypeProperty.indexingType;
    /**
     * The minimum value that properties of this type should be able to contain. Value type must match the type of the property.
     */
    minimum?: (number | null | string | null) | null;
    /**
     * The minimum value that properties of this type should be able to contain. Value type must match the type of the property.
     */
    maximum?: (number | null | string | null) | null;
    /**
     * A list of possible values that properties of this type should be able to contain.
     */
    enum?: Array<EnumerationValue> | null;
    imageDescriptor?: ImageDescriptor;
    /**
     * The minimum string length that properties of this type should be able to contain.
     */
    minLength?: number | null;
    /**
     * The maximum string length that properties of this type should be able to contain.
     */
    maxLength?: number | null;
    /**
     * Regular expression pattern that limits what value that a string type property should be able to contain.
     */
    pattern?: string | null;
    /**
     * Optional minimum list length validation.
     */
    minItems?: number | null;
    /**
     * Optional maximum list length validation.
     */
    maxItems?: number | null;
    /**
     * Specifies which content types and base types these property items are allowed to contain.
     */
    allowedTypes?: Array<string>;
    /**
     * Specifies which content types and base types these property items cannot contain.
     */
    restrictedTypes?: Array<string>;
    items?: ArrayItem;
};
export namespace ContentTypeProperty {
    /**
     * Gets the data type for the property.
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
        ARRAY = 'array',
        COMPONENT = 'component',
    }
    /**
     * Indicates how should this property will be indexed in the search engine.
     * If this value is not explicitly set, the property will be indexed using default indexing setting of the search engine.
     */
    export enum indexingType {
        DISABLED = 'disabled',
        QUERYABLE = 'queryable',
        SEARCHABLE = 'searchable',
    }
}

