/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SecurityIdentity } from './SecurityIdentity';
/**
 * Represents a locale that can be used for content.
 */
export type Locale = {
    /**
     * The unique identifier (key) of the resource. This is the IETF BCP-47 language tag (e.g., "en", "en-US", "sv-SE").
     */
    key: string;
    /**
     * The display name of this locale.
     */
    displayName: string;
    /**
     * Indicates whether this locale is enabled and can be used to create content.
     */
    isEnabled?: boolean;
    /**
     * A string that represents the segment that should be used when routing or generate routes to the current locale
     */
    routeSegment: string;
    /**
     * A value that is used when sorting locales.
     */
    sortOrder?: number;
    /**
     * The access rights assigned to this locale that defines who can create content in this locale. If no access rights are assigned, everyone will be able to create content in this locale. An empty array means that no user will be allowed to create or change content in this locale.
     */
    accessRights?: Array<SecurityIdentity> | null;
    /**
     * A timestamp indicating when this locale was first created.
     */
    readonly created?: string;
    /**
     * The username of the user that created this locale.
     */
    readonly createdBy?: string;
    readonly lastModified?: string;
    /**
     * The username of the user that last modified this locale.
     */
    readonly lastModifiedBy?: string;
};

