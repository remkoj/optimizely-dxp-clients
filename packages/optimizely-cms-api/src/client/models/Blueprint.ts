/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BlueprintData } from './BlueprintData';
/**
 * Represents a blueprint of a content item.
 */
export type Blueprint = {
    /**
     * The key that identifies this blueprint.
     */
    readonly key?: string;
    /**
     * The display name of this blueprint.
     */
    displayName: string;
    /**
     * The content type of this blueprint.
     */
    readonly contentType?: string;
    lastModified?: string;
    /**
     * The username of the user that made the latest modification to this blueprint.
     */
    readonly lastModifiedBy?: string;
    content?: BlueprintData;
};

