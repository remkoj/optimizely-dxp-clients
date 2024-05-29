import type { DisplayTemplate } from './DisplayTemplate';
export type DisplayTemplatePage = {
    /**
     * The items in this paged collection.
     */
    readonly items?: Array<DisplayTemplate>;
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