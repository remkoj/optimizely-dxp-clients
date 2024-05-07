import type { ContentTypeProperty } from './ContentTypeProperty';
/**
 * Describes a property that can contain a timestamp.
 */
export type DateTimeProperty = (ContentTypeProperty & {
    /**
     * The earliest timestamp that properties of this type should be able to contain.
     */
    minimum?: string | null;
    /**
     * The latest timestamp that properties of this type should be able to contain.
     */
    maximum?: string | null;
});
