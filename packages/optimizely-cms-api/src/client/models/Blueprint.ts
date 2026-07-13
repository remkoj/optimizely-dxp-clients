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
     * The unique identifier (key) of the resource.
     */
    key?: string;
    /**
     * The display name of this blueprint.
     */
    displayName: string;
    /**
     * The content type of this blueprint.
     */
    contentType: string;
    /**
     * A timestamp indicating when this resource was first created.
     */
    readonly created?: string;
    /**
     * The name of the user or application that created this resource.
     */
    readonly createdBy?: string;
    /**
     * Indicates the last time this resource was modified.
     */
    readonly lastModified?: string;
    /**
     * The name of the user or application that last modified this resource.
     */
    readonly lastModifiedBy?: string;
    content: BlueprintData;
};

