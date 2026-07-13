/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Metadata about a content item in the content hierarchy, including ownership, localization, and audit information. This represents the structural information without the actual property values.
 */
export type ContentNode = {
    /**
     * The unique identifier (key) of the resource.
     */
    key?: string;
    /**
     * The content item that contains this item in the hierarchy.
     */
    container?: string;
    /**
     * The content item that owns this item. Content that is owned by another content is also known as an asset. Cannot be combined with container.
     */
    owner?: string;
    /**
     * The content type that defines the structure and available properties for this item.
     */
    readonly contentType?: string;
    /**
     * The locale for which this content was originally created. This locale will include properties that are shared across all locales.
     */
    readonly primaryLocale?: string;
    /**
     * The complete list of locales for which this content has been created for.
     */
    readonly locales?: Array<string>;
    /**
     * The date and time when this content was last modified.
     */
    readonly lastModified?: string;
    /**
     * The username of the user that last modified this content.
     */
    readonly lastModifiedBy?: string;
    /**
     * The date and time when this content was first created.
     */
    readonly created?: string;
    /**
     * The username of the user who created this content.
     */
    readonly createdBy?: string;
    /**
     * If populated, the date and time when this content was deleted.
     */
    readonly deleted?: string | null;
    /**
     * The username of the user who deleted this content. Only populated if the content is deleted.
     */
    readonly deletedBy?: string;
};

