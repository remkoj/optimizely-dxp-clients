/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationHost } from './ApplicationHost';
import type { ApplicationType } from './ApplicationType';
/**
 * Represents a CMS application (website or remote website).
 */
export type Application = {
    /**
     * The unique identifier (key) of the resource.
     */
    key?: string;
    /**
     * The display name of this Application.
     */
    displayName: string;
    type: ApplicationType;
    /**
     * A string that is used to indicate the source of this Application.
     */
    readonly source?: string;
    /**
     * A reference to the entry point (start page) content for this application.
     */
    entryPoint: string;
    /**
     * Whether this is the default application.
     */
    isDefault?: boolean;
    /**
     * Whether this application uses a dedicated assets folder.
     */
    useApplicationSpecificAssets?: boolean;
    /**
     * Returns the root for application-specific assets, if UseApplicationSpecificAssets is true.
     */
    readonly assetsRoot?: string | null;
    /**
     * The hosts assigned to this application.
     */
    hosts?: Array<ApplicationHost>;
    /**
     * Whether to use preview tokens for this application. Only applicable when the type is 'website'.
     */
    usePreviewTokens?: boolean;
    /**
     * A dictionary of preview URL formats keyed by content type base or content type key. Only applicable when the type is 'website'.
     */
    previewUrlFormats?: Record<string, string>;
    /**
     * A timestamp indicating when this resource was first created.
     */
    readonly created?: string;
    /**
     * The name of the user or application that created this resource.
     */
    readonly createdBy?: string;
    /**
     * Indicates the last time this resource was modified.
     */
    readonly lastModified?: string;
    /**
     * The name of the user or application that last modified this resource.
     */
    readonly lastModifiedBy?: string;
};

