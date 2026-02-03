/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Represent the definition of semantic property formats for content items.
 */
export type PropertyFormat = {
    /**
     * The key that identifies this PropertyFormat.
     */
    key?: string;
    /**
     * The underlying data type used for this PropertyFormat.
     */
    dataType?: PropertyFormat.dataType;
    /**
     * The underlying item type used for this PropertyFormat.
     */
    itemType?: PropertyFormat.itemType;
    /**
     * The name and identifier of this PropertyFormat.
     */
    displayName?: string;
    /**
     * Indicates if this property format has been deleted.
     */
    readonly deleted?: boolean;
    /**
     * A timestamp indicating when this display template was first created.
     */
    readonly created?: string;
    /**
     * The username of the user that created this display template.
     */
    readonly createdBy?: string;
    /**
     * A timestamp indicating when this display template was last modified.
     */
    readonly lastModified?: string;
    /**
     * The username of the user that last modified this display template.
     */
    readonly lastModifiedBy?: string;
};
export namespace PropertyFormat {
    /**
     * The underlying data type used for this PropertyFormat.
     */
    export enum dataType {
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
     * The underlying item type used for this PropertyFormat.
     */
    export enum itemType {
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
}

