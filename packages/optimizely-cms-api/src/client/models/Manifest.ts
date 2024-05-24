/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentType } from './ContentType';
import type { DisplayTemplate } from './DisplayTemplate';
import type { PropertyGroup } from './PropertyGroup';
/**
 * Manifest that describest CMS definitions.
 */
export type Manifest = {
    /**
     * List of content type property groups.
     */
    propertyGroups?: Array<PropertyGroup>;
    /**
     * List of content types.
     */
    contentTypes?: Array<ContentType>;
    /**
     * List of display templates.
     */
    displayTemplates?: Array<DisplayTemplate>;
    /**
     * A timestamp indicated when any item in this manifest was last modified.
     */
    readonly lastModified?: string;
};

