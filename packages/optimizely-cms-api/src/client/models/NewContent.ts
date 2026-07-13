/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentVersion } from './ContentVersion';
/**
 * Represents a new content and the initial data required to create it.
 */
export type NewContent = {
    /**
     * The key that identifies the content item to be created. If not provided, a new key will be generated.
     */
    key?: string;
    /**
     * The content type for the content item to be created.
     */
    contentType: string;
    /**
     * The key that identifies the container content where this content item should be created.
     */
    container?: string;
    /**
     * The key that identifies the owner for the content item to be created. Content that is owned by another content is also known as an asset.
     */
    owner?: string;
    initialVersion: ContentVersion;
};

