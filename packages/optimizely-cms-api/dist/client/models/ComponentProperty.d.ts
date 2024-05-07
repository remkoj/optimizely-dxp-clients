import type { ContentTypeProperty } from './ContentTypeProperty';
/**
 * Describes a property that can contain a component instance of a specific type.
 */
export type ComponentProperty = (ContentTypeProperty & {
    /**
     * The key of the ContentType that this ComponentProperty can contain.
     */
    contentType: string;
});
