import type { ContentTypeProperty } from './ContentTypeProperty';
import type { ImageDescriptor } from './ImageDescriptor';
/**
 * Describes a property that can contain a reference to binary data.
 */
export type BinaryProperty = (ContentTypeProperty & {
    imageDescriptor?: ImageDescriptor;
});
