import type { ListPropertyItem } from './ListPropertyItem';
/**
 * Describes a property list item that can hold a reference to a content item.
 */
export type ContentReferenceListItem = (ListPropertyItem & {
    /**
     * Specifies which content types and base types these list items are allowed to reference.
     */
    allowedTypes?: Array<string>;
    /**
     * Specifies which content types and base types these list items cannot contain.
     */
    restrictedTypes?: Array<string>;
});
