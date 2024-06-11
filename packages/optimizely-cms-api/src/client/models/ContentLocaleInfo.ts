/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocaleStatus } from './LocaleStatus';
/**
 * Describes information about a locale instance of a content item.
 */
export type ContentLocaleInfo = {
    /**
     * The display name of the content.
     */
    readonly displayName?: string;
    /**
     * The date and time when the first locale version for the content was created.
     */
    readonly created?: string;
    /**
     * The username of the user that created this locale version of content.
     */
    readonly createdBy?: string;
    status?: LocaleStatus;
};

