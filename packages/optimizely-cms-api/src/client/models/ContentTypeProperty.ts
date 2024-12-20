/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IndexingType } from './IndexingType';
import type { PropertyDataType } from './PropertyDataType';
/**
 * Describes a property of a ContentType in the CMS.
 */
export type ContentTypeProperty = {
    type: PropertyDataType;
    /**
     * The key of the PropertyFormat that this ContentTypeProperty is an instance of.
     */
    format?: string | null;
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
    indexingType?: IndexingType;
    /**
     * Editor used for managing this property.
     */
    editor?: string | null;
    /**
     * Settings for the editor.
     */
    editorSettings?: Record<string, Record<string, any>> | null;
};

