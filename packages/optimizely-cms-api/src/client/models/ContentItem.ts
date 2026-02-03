/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CompositionNode } from './CompositionNode';
/**
 * Represents a version of a content item.
 */
export type ContentItem = {
    /**
     * Properties as they are defined by corresponding component or content type.
     */
    properties?: Record<string, any>;
    /**
     * The key that identifies this content item.
     */
    readonly key?: string;
    /**
     * The locale of this content instance.
     */
    readonly locale?: string;
    /**
     * The version identifier of this content instance.
     */
    readonly version?: string;
    /**
     * The variation of this content item, if any. Variations are used to represent different states or forms of the same content item.
     * A variation has it's own publish lifecycle. A variation can though not be published before the default version of same local is published.
     */
    readonly variation?: string | null;
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
    /**
     * The status of this version of the content item.
     */
    status?: ContentItem.status;
    /**
     * Indicates a time when this content version should transition to published status. Must only be assigned when Status is set to Scheduled.
     */
    delayPublishUntil?: string | null;
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
    lastModified?: string;
    /**
     * The username of the user that made the latest modification to this content instance.
     */
    readonly lastModifiedBy?: string;
    composition?: CompositionNode;
};
export namespace ContentItem {
    /**
     * The status of this version of the content item.
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

