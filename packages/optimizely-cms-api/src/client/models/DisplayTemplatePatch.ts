/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DisplaySetting } from './DisplaySetting';
/**
 * Describes a display template that can be assigned to content.
 */
export type DisplayTemplatePatch = {
    /**
     * The display name of this display template.
     */
    displayName?: string | null;
    /**
     * The optional node type this display template is valid for.
     */
    nodeType?: string | null;
    /**
     * The optional base type this display template is valid for.
     */
    baseType?: string | null;
    /**
     * The optional key of the content type this display template is valid for.
     */
    contentType?: string | null;
    /**
     * If this is the default display template for the associated base type, node type or content type.
     */
    isDefault?: boolean | null;
    /**
     * The available settings for this display template.
     */
    settings?: Record<string, DisplaySetting> | null;
};

