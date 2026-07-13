/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CompositionNode } from './CompositionNode';
import type { ContentData } from './ContentData';
import type { MediaData } from './MediaData';
/**
 * Represents a version of a content item.
 */
export type ContentVersion = (ContentData & {
    /**
     * The key that identifies this content version.
     */
    key?: string;
    /**
     * The locale of this content version.
     */
    locale?: string;
    /**
     * The version identifier of this instance.
     */
    readonly version?: string;
    /**
     * The variation of this content version, if any. Variations are used to represent different states or forms of the same content item. A variation has its own publishing lifecycle. A variation cannot be published before the default version of same locale has been published.
     */
    variation?: string;
    /**
     * The content type of this content item.
     */
    readonly contentType?: string;
    /**
     * The display name of this content version.
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
    /**
     * The status of this content version.
     */
    readonly status?: ContentVersion.status;
    /**
     * The timestamp when a scheduled version will be published. Only present when status is 'scheduled'.
     */
    readonly delayPublishUntil?: string | null;
    /**
     * A string that represents the segment that should be used when routing or generating routes to the current content instance. This value will always be null when content is based on a non-routable content type.
     */
    routeSegment?: string;
    /**
     * A simple route (shortcut URL) used to access pages and experiences.
     */
    simpleRoute?: string;
    readonly lastModified?: string;
    readonly lastModifiedBy?: string;
    composition?: CompositionNode;
    media?: MediaData;
});
export namespace ContentVersion {
    /**
     * The status of this content version.
     */
    export enum status {
        DRAFT = 'draft',
        READY = 'ready',
        PUBLISHED = 'published',
        PREVIOUS = 'previous',
        SCHEDULED = 'scheduled',
        REJECTED = 'rejected',
        IN_REVIEW = 'inReview',
    }
}

