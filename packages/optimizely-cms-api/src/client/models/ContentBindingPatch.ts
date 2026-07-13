/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Associates a content item with another source content item, establishing a relationship defined by a content type binding. Used for linking managed content to external or reference content.
 */
export type ContentBindingPatch = {
    /**
     * The binding definition key that controls how the source content item is linked and accessed.
     */
    contentTypeBinding?: string | null;
    /**
     * The reference to the source content item that is being bound. This cannot be empty.
     */
    source?: string | null;
};

