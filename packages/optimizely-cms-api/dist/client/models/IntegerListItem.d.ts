import type { Int32EnumerationSettings } from './Int32EnumerationSettings';
import type { ListPropertyItem } from './ListPropertyItem';
/**
 * Describes a property list item that can contain integers.
 */
export type IntegerListItem = (ListPropertyItem & {
    /**
     * The minimum value that list items of this type should be able to contain.
     */
    minimum?: number | null;
    /**
     * The maximum value that list items of this type should be able to contain.
     */
    maximum?: number | null;
    enum?: Int32EnumerationSettings;
});
