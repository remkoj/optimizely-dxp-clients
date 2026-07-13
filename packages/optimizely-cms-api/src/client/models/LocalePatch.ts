/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SecurityIdentityPatch } from './SecurityIdentityPatch';
/**
 * Represents a locale that can be used for content.
 */
export type LocalePatch = {
    /**
     * The display name of this locale.
     */
    displayName?: string | null;
    /**
     * Indicates whether this locale is enabled and can be used to create content.
     */
    isEnabled?: boolean | null;
    /**
     * A string that represents the segment that should be used when routing or generate routes to the current locale
     */
    routeSegment?: string | null;
    /**
     * A value that is used when sorting locales.
     */
    sortOrder?: number | null;
    /**
     * The access rights assigned to this locale that defines who can create content in this locale. If no access rights are assigned, everyone will be able to create content in this locale. An empty array means that no user will be allowed to create or change content in this locale.
     */
    accessRights?: Array<SecurityIdentityPatch> | null;
};

