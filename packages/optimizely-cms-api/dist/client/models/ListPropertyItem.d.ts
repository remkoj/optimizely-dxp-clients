import type { PropertyDataType } from './PropertyDataType';
/**
 * Describes the list item of a ListProperty in the CMS.
 */
export type ListPropertyItem = {
    type: PropertyDataType;
    /**
     * The key of the PropertyFormat that this property item is an instance of.
     */
    format?: string | null;
};
