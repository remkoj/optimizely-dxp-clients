/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentItem } from './ContentItem';
import type { ContentType } from './ContentType';
/**
 * The response object for Page`1 when used ContentType are included.
 */
export type ContentItemListWithContentTypes = {
    /**
     * The content types that are used by the content items in the response.
     */
    readonly contentTypes?: Array<ContentType>;
    /**
     * The content items in this paged collection.
     */
    readonly items?: Array<ContentItem>;
    /**
     * The zero-based index of the current page.
     */
    readonly pageIndex?: number;
    /**
     * The number of item in each page. Not necessarily the same as the number of items in this page.
     */
    readonly pageSize?: number;
    /**
     * The estimated total number of items in the collection. May be omitted if the total item count is unknown.
     */
    readonly totalItemCount?: number;
};

