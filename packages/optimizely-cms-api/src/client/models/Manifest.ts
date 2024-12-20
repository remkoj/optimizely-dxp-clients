/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentType } from './ContentType';
import type { DisplayTemplate } from './DisplayTemplate';
import type { PropertyGroup } from './PropertyGroup';
/**
 * Manifest that describe CMS definitions.
 */
export type Manifest = {
    /**
     * List of content type property groups that are part of this manifest.
     */
    propertyGroups?: Array<PropertyGroup>;
    /**
     * List of content types that are part of this manifest.
     */
    contentTypes?: Array<ContentType>;
    /**
     * List of display templates that are part of this manifest.
     */
    displayTemplates?: Array<DisplayTemplate>;
    /**
     * A timestamp indicated when any item in this manifest was last modified.
     */
    readonly lastModified?: string;
};

