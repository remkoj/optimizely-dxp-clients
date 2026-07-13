/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ArrayItem } from './ArrayItem';
import type { EnumerationValue } from './EnumerationValue';
/**
 * Defines a single property within a content type, including its data type, validation rules, and editorial metadata.
 */
export type ContentTypeProperty = {
    /**
     * The fundamental data type of this property (e.g., string, integer, content reference).
     */
    type: ContentTypeProperty.type;
    /**
     * The property format that defines specialized handling and validation for this property.
     */
    format?: string;
    /**
     * The content type key that this property contains when the type is 'component'.
     */
    contentType?: string;
    /**
     * The user-friendly name for this property, displayed in editorial interfaces.
     */
    displayName?: string;
    /**
     * A description explaining the purpose and usage of this property for content editors.
     */
    description?: string;
    /**
     * Whether the property value is translated separately for each locale or shared across all locales.
     */
    isLocalized?: boolean;
    /**
     * Whether content items must always provide a value for this property before publication.
     */
    isRequired?: boolean;
    /**
     * The property group this field belongs to for organizational purposes in the editor. Leave empty to allow automatic grouping.
     */
    group?: string;
    /**
     * The display order of this property within its group (lower numbers appear first).
     */
    sortOrder?: number;
    /**
     * Indicates how this property will be indexed in the search engine. If not explicitly set, the property will be indexed using the default indexing setting of the search engine.
     */
    indexingType?: ContentTypeProperty.indexingType;
    /**
     * Indicates how this property is displayed in the editing interface. If not explicitly set, the property will be available for editing.
     */
    displayMode?: ContentTypeProperty.displayMode;
    /**
     * The lowest value (inclusive) allowed for numeric or date properties. Type must match the property's data type.
     */
    minimum?: (number | null | string | null) | null;
    /**
     * The highest value (inclusive) allowed for numeric or date properties. Type must match the property's data type.
     */
    maximum?: (number | null | string | null) | null;
    /**
     * A predefined list of allowed values for this property. The enumeration values must match the property's data type. Allowed for string, integer, float and date-time property types.
     */
    enum?: Array<EnumerationValue> | null;
    /**
     * The minimum character length for string-type properties.
     */
    minLength?: number | null;
    /**
     * The maximum character length for string-type properties.
     */
    maxLength?: number | null;
    /**
     * Regular expression pattern that limits what value that a string type property must match.
     */
    pattern?: string;
    /**
     * The minimum number of items allowed in array-type properties.
     */
    minItems?: number | null;
    /**
     * The maximum number of items allowed in array-type properties.
     */
    maxItems?: number | null;
    /**
     * Content types and base types that this property is permitted to contain. Used by properties of content or content reference type.
     */
    allowedTypes?: Array<string>;
    /**
     * Content types and base types that items in this property are forbidden from containing. Used by properties of content or content reference type.
     */
    restrictedTypes?: Array<string>;
    /**
     * Defines editor specific settings for this property. Editor settings are specific to the item and editor type.
     */
    editorSettings?: Record<string, any> | null;
    items?: ArrayItem;
};
export namespace ContentTypeProperty {
    /**
     * The fundamental data type of this property (e.g., string, integer, content reference).
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
        ARRAY = 'array',
        COMPONENT = 'component',
    }
    /**
     * Indicates how this property will be indexed in the search engine. If not explicitly set, the property will be indexed using the default indexing setting of the search engine.
     */
    export enum indexingType {
        DISABLED = 'disabled',
        QUERYABLE = 'queryable',
        SEARCHABLE = 'searchable',
    }
    /**
     * Indicates how this property is displayed in the editing interface. If not explicitly set, the property will be available for editing.
     */
    export enum displayMode {
        AVAILABLE = 'available',
        HIDDEN = 'hidden',
    }
}

