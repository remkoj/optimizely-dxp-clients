/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { VersionStatus } from './VersionStatus';
/**
 * Represents a version of a content item.
 */
export type ContentItem = {
    /**
     * Set of content type properties.
     */
    properties?: Record<string, any>;
    /**
     * The key that identifies this content item.
     */
    readonly key: string;
    /**
     * The locale of this content instance.
     */
    readonly locale?: string;
    /**
     * The version identifier of this content instance.
     */
    readonly version?: string;
    /**
     * The content type of this content item.
     */
    readonly contentType?: string;
    /**
     * The display name of this content item.
     */
    displayName: string;
    /**
     * Indicates a time when this content was published or should be published.
     */
    published?: string | null;
    /**
     * Indicates a time when this content expired or should expire.
     */
    expired?: string | null;
    status?: VersionStatus;
    /**
     * Indicates a time when this content version should transition to published status. Must only be assigned when Status is set to Scheduled.
     */
    delayPublishUntil?: string | null;
    readonly lastModified?: string;
    /**
     * The username of the user that made the latest modification to this content instance.
     */
    readonly lastModifiedBy?: string;
    /**
     * The key that identifies the container content that this content item belongs to.
     */
    container?: string | null;
    /**
     * The key that identifies the owner of this content. Content that is own by another content is also known as an asset.
     */
    owner?: string | null;
    /**
     * A string that represents the segment that should be used when routing or generate routes to the current content instance.
     */
    routeSegment?: string | null;
};

