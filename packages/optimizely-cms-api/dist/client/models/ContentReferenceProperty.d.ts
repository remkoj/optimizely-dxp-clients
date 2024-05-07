import type { ContentTypeProperty } from './ContentTypeProperty';
/**
 * Describes a property that can contain a reference to a content item.
 */
export type ContentReferenceProperty = (ContentTypeProperty & {
    /**
     * Specifies which content types and base types this property is allowed to reference.
     */
    allowedTypes?: Array<string>;
    /**
     * Specifies which content types and base types this property is restricted from referencing.
     */
    restrictedTypes?: Array<string>;
});
