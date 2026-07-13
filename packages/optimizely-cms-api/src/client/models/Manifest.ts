/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentType } from './ContentType';
import type { DisplayTemplate } from './DisplayTemplate';
import type { Locale } from './Locale';
import type { PropertyGroup } from './PropertyGroup';
/**
 * Manifest that describes CMS definitions.
 */
export type Manifest = {
    /**
     * List of locales that are part of this manifest.
     */
    locales?: Array<Locale> | null;
    /**
     * List of content type property groups that are part of this manifest.
     */
    propertyGroups?: Array<PropertyGroup> | null;
    /**
     * List of content types that are part of this manifest.
     */
    contentTypes?: Array<ContentType> | null;
    /**
     * List of display templates that are part of this manifest.
     */
    displayTemplates?: Array<DisplayTemplate> | null;
    /**
     * A timestamp indicating the last time an item included in this manifest was modified.
     */
    lastModified?: string;
};

