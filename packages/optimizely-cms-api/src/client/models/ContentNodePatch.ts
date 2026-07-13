/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Metadata about a content item in the content hierarchy, including ownership, localization, and audit information. This represents the structural information without the actual property values.
 */
export type ContentNodePatch = {
    /**
     * The content item that contains this item in the hierarchy.
     */
    container?: string | null;
    /**
     * The content item that owns this item. Content that is owned by another content is also known as an asset. Cannot be combined with container.
     */
    owner?: string | null;
};

