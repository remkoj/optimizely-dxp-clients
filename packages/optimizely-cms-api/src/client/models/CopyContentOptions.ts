/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Options for copying content.
 */
export type CopyContentOptions = {
    /**
     * Indicates if deleted content could be used as source.
     */
    allowDeleted?: boolean;
    /**
     * Optional key of the container where the copied content should be placed.
     */
    container?: string | null;
    /**
     * Optional key of the owner where the copied content should be placed.
     */
    owner?: string | null;
    /**
     * Indicates if published versions of the content should keep their published status rather than being created as a draft version at the destination.
     */
    keepPublishedStatus?: boolean;
};

