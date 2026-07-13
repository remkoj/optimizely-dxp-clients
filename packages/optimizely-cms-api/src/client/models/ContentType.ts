/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentTypeProperty } from './ContentTypeProperty';
import type { SecurityIdentity } from './SecurityIdentity';
/**
 * Represents a content type definition.
 */
export type ContentType = {
    /**
     * The unique identifier (key) of the resource.
     */
    key?: string;
    /**
     * The display name of this ContentType.
     */
    displayName: string;
    /**
     * A description of this ContentType.
     */
    description?: string;
    /**
     * The base type of this ContentType. Ignored for contracts; required for all other content types.
     */
    baseType?: string | null;
    /**
     * Specifies if the ContentType is a contract type.
     */
    isContract?: boolean;
    /**
     * A string that indicates the source of this content type. Can be used to distinguish content types created by the system from types coming from model classes in the CMS solution.
     */
    readonly source?: string;
    /**
     * A value that is used to when sorting ContentType instances.
     */
    sortOrder?: number;
    /**
     * Provides a set of content types that can be created in containers of this type
     */
    mayContainTypes?: Array<string>;
    /**
     * Provides a set of media file extensions that this content type can handle.
     */
    mediaFileExtensions?: Array<string>;
    /**
     * Provides a set of composition behaviors specifying how this content type can be used within compositions. Currently this can only be assigned when baseType is 'component'.
     */
    compositionBehaviors?: Array<'sectionEnabled' | 'elementEnabled' | 'formsElementEnabled'>;
    /**
     * Provides a set of contract content types that this content type is bound to.
     */
    contracts?: Array<string>;
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
    /**
     * Dictionary with all custom properties of this ContentType.
     */
    properties?: Record<string, ContentTypeProperty>;
    /**
     * The access rights assigned to this content type that defines who can create content of this type. If no access rights are assigned, everyone will be able to create content of this type. An empty array means that no new content of this type can be created.
     */
    accessRights?: Array<SecurityIdentity> | null;
};

