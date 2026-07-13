/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentSource } from './ContentSource';
/**
 * Represents a single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count.
 */
export type ContentSourcePage = {
    /**
     * The items in this paged collection.
     */
    readonly items?: Array<ContentSource>;
    /**
     * The zero-based index of the current page.
     */
    readonly pageIndex?: number;
    /**
     * The number of items in each page. Not necessarily the same as the number of items in this page.
     */
    readonly pageSize?: number;
    /**
     * The estimated total number of items in the collection. May be omitted if the total count is unknown.
     */
    readonly totalCount?: number | null;
};

