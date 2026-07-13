/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentTypeProperty } from './ContentTypeProperty';
import type { SecurityIdentityPatch } from './SecurityIdentityPatch';
/**
 * Represents a content type definition.
 */
export type ContentTypePatch = {
    /**
     * The display name of this ContentType.
     */
    displayName?: string | null;
    /**
     * A description of this ContentType.
     */
    description?: string | null;
    /**
     * A value that is used to when sorting ContentType instances.
     */
    sortOrder?: number | null;
    /**
     * Provides a set of content types that can be created in containers of this type
     */
    mayContainTypes?: Array<string> | null;
    /**
     * Provides a set of media file extensions that this content type can handle.
     */
    mediaFileExtensions?: Array<string> | null;
    /**
     * Provides a set of composition behaviors specifying how this content type can be used within compositions. Currently this can only be assigned when baseType is 'component'.
     */
    compositionBehaviors?: Array<'sectionEnabled' | 'elementEnabled' | 'formsElementEnabled'> | null;
    /**
     * Provides a set of contract content types that this content type is bound to.
     */
    contracts?: Array<string> | null;
    /**
     * Dictionary with all custom properties of this ContentType.
     */
    properties?: Record<string, ContentTypeProperty> | null;
    /**
     * The access rights assigned to this content type that defines who can create content of this type. If no access rights are assigned, everyone will be able to create content of this type. An empty array means that no new content of this type can be created.
     */
    accessRights?: Array<SecurityIdentityPatch> | null;
};

