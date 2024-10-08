/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentBaseType } from './ContentBaseType';
import type { DisplaySetting } from './DisplaySetting';
/**
 * Describes a display template that can be assigned to content.
 */
export type DisplayTemplate = {
    /**
     * The key that identifies this display template.
     */
    readonly key: string;
    /**
     * The display name of this display template.
     */
    displayName: string;
    /**
     * The optional node type this display template is valid for.
     */
    nodeType?: string | null;
    baseType?: ContentBaseType;
    /**
     * The optional key of the content type this display template is valid for.
     */
    contentType?: string | null;
    /**
     * If this is the default display template for the associated base type,
     * node type or content type.
     */
    isDefault?: boolean;
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
    /**
     * The available settings for this display template.
     */
    settings?: Record<string, DisplaySetting>;
};

