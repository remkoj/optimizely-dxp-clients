/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BinaryProperty } from './BinaryProperty';
import type { BooleanProperty } from './BooleanProperty';
import type { ComponentProperty } from './ComponentProperty';
import type { ContentBaseType } from './ContentBaseType';
import type { ContentProperty } from './ContentProperty';
import type { ContentReferenceProperty } from './ContentReferenceProperty';
import type { ContentTypeFeature } from './ContentTypeFeature';
import type { ContentTypeUsage } from './ContentTypeUsage';
import type { DateTimeProperty } from './DateTimeProperty';
import type { FloatProperty } from './FloatProperty';
import type { IntegerProperty } from './IntegerProperty';
import type { JsonStringProperty } from './JsonStringProperty';
import type { ListProperty } from './ListProperty';
import type { StringProperty } from './StringProperty';
import type { UrlProperty } from './UrlProperty';
/**
 * A writable implementation of an ContentType.
 */
export type ContentType = {
    /**
     * The key that identifies this ContentType.
     */
    readonly key: string;
    /**
     * The display name of this ContentType.
     */
    displayName?: string;
    /**
     * A description of this ContentType.
     */
    description?: string;
    baseType?: ContentBaseType;
    /**
     * A string that is used to indicate the source of this ContentType.
     */
    readonly source?: string;
    /**
     * An value that is used to when sorting ContentType instances.
     */
    sortOrder?: number;
    /**
     * Provides a set of features that content based on this ContentType supports.
     * This value is assigned based on the BaseType and cannot be modified.
     */
    features?: Array<ContentTypeFeature>;
    /**
     * Specifies how this ContentType can be used.
     */
    usage?: Array<ContentTypeUsage>;
    /**
     * Provides a set of content types that can be created in container of this type
     */
    mayContainTypes?: Array<string>;
    /**
     * Provides a set of media file extensions that this content type can handle.
     */
    mediaFileExtensions?: Array<string>;
    /**
     * A timestamp indicating when this ContentType was first created.
     */
    readonly created?: string;
    /**
     * The username of the user that made the latest modification to this ContentType.
     */
    readonly lastModifiedBy?: string;
    /**
     * Indicates the last time this content type was modified.
     */
    readonly lastModified?: string;
    /**
     * Dictionary with all custom properties of this ContentType.
     */
    properties?: Record<string, (BinaryProperty | BooleanProperty | ComponentProperty | ContentProperty | ContentReferenceProperty | DateTimeProperty | FloatProperty | IntegerProperty | StringProperty | UrlProperty | JsonStringProperty | ListProperty | {
        /**
         * Settings for the editor.
         */
        editorSettings?: Record<string, Record<string, any>> | null;
    })>;
};

