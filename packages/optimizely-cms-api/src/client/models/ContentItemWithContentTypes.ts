/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentItem } from './ContentItem';
import type { ContentType } from './ContentType';
/**
 * The response object for ContentItem when used ContentType are included.
 */
export type ContentItemWithContentTypes = {
    /**
     * The content types that are used by the content item in the response.
     */
    readonly contentTypes?: Array<ContentType>;
    item?: ContentItem;
};

