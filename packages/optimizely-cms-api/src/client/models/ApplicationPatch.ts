/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationHostPatch } from './ApplicationHostPatch';
import type { ApplicationTypePatch } from './ApplicationTypePatch';
/**
 * Represents a CMS application (website or remote website).
 */
export type ApplicationPatch = {
    /**
     * The display name of this Application.
     */
    displayName?: string | null;
    type?: ApplicationTypePatch;
    /**
     * A reference to the entry point (start page) content for this application.
     */
    entryPoint?: string | null;
    /**
     * Whether this is the default application.
     */
    isDefault?: boolean | null;
    /**
     * Whether this application uses a dedicated assets folder.
     */
    useApplicationSpecificAssets?: boolean | null;
    /**
     * The hosts assigned to this application.
     */
    hosts?: Array<ApplicationHostPatch> | null;
    /**
     * Whether to use preview tokens for this application. Only applicable when the type is 'website'.
     */
    usePreviewTokens?: boolean | null;
    /**
     * A dictionary of preview URL formats keyed by content type base or content type key. Only applicable when the type is 'website'.
     */
    previewUrlFormats?: Record<string, string> | null;
};

