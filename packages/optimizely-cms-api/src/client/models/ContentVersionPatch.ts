/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CompositionNodePatch } from './CompositionNodePatch';
import type { ContentDataPatch } from './ContentDataPatch';
import type { MediaDataPatch } from './MediaDataPatch';
/**
 * Represents a version of a content item.
 */
export type ContentVersionPatch = (ContentDataPatch & {
    /**
     * The display name of this content version.
     */
    displayName?: string | null;
    /**
     * Indicates a time when this content was published or should be published.
     */
    published?: string | null;
    /**
     * Indicates a time when this content expired or should expire.
     */
    expired?: string | null;
    /**
     * A string that represents the segment that should be used when routing or generating routes to the current content instance. This value will always be null when content is based on a non-routable content type.
     */
    routeSegment?: string | null;
    /**
     * A simple route (shortcut URL) used to access pages and experiences.
     */
    simpleRoute?: string | null;
    composition?: CompositionNodePatch;
    media?: MediaDataPatch;
});

