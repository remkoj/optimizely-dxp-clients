/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentLocaleInfo } from './ContentLocaleInfo';
/**
 * Represents metadata about a content item.
 */
export type ContentMetadata = {
    /**
     * The key that identifies this content.
     */
    key?: string;
    /**
     * The content type of this content.
     */
    contentType?: string;
    /**
     * The key that identifies the container content that this content belongs to.
     */
    container?: string | null;
    /**
     * Indicates if the content contains any content items.
     */
    readonly hasItems?: boolean;
    /**
     * The key that identifies the owner of this content. Content that is own by another content is also known as an asset.
     */
    owner?: string | null;
    /**
     * Set of locales that the content item has been created for.
     */
    readonly locales?: Record<string, ContentLocaleInfo>;
    /**
     * A timestamp indicating when this content was first created.
     */
    readonly created?: string;
    /**
     * The username of the user that created this content.
     */
    readonly createdBy?: string;
    /**
     * A timestamp, which if provided, indicates when this content was deleted.
     */
    readonly deleted?: string | null;
    /**
     * The username of the user that deleted this content.
     */
    readonly deletedBy?: string | null;
};

