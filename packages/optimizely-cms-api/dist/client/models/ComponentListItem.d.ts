import type { ListPropertyItem } from './ListPropertyItem';
/**
 * Describes a property list item that can contain a component instance of a specific type.
 */
export type ComponentListItem = (ListPropertyItem & {
    /**
     * The key of the ContentType that this ComponentProperty can contain.
     */
    contentType: string;
});
