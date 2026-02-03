/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentTypeProperty } from './ContentTypeProperty';
/**
 * A writable implementation of an ContentType.
 */
export type ContentType = {
    /**
     * The key that identifies this ContentType.
     */
    key?: string;
    /**
     * The display name of this ContentType.
     */
    displayName?: string;
    /**
     * A description of this ContentType.
     */
    description?: string;
    /**
     * The base type of this ContentType.
     * Ignored for contracts; required for all other content types.
     */
    baseType?: string | null;
    /**
     * A string that is used to indicate the source of this ContentType.
     */
    readonly source?: string;
    /**
     * A value that is used to when sorting ContentType instances.
     */
    sortOrder?: number;
    /**
     * Provides a set of content types that can be created in containers of this type
     */
    mayContainTypes?: Array<string>;
    /**
     * Provides a set of media file extensions that this content type can handle.
     */
    mediaFileExtensions?: Array<string>;
    /**
     * Provides a set of composition behaviors specifying how this content type can be used within compositions.
     */
    compositionBehaviors?: Array<'sectionEnabled' | 'elementEnabled' | 'formsElementEnabled'>;
    /**
     * A timestamp indicating when this ContentType was first created.
     */
    readonly created?: string;
    /**
     * Indicates the last time this content type was modified.
     */
    readonly lastModified?: string;
    /**
     * The username of the user that made the latest modification to this ContentType.
     */
    readonly lastModifiedBy?: string;
    /**
     * Dictionary with all custom properties of this ContentType.
     */
    properties?: Record<string, ContentTypeProperty>;
};

