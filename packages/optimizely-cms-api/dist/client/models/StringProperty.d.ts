import type { ContentTypeProperty } from './ContentTypeProperty';
import type { StringEnumerationSettings } from './StringEnumerationSettings';
/**
 * Describes a property that can contain strings.
 */
export type StringProperty = (ContentTypeProperty & {
    minLength?: number | null;
    maxLength?: number | null;
    /**
     * Regular expression pattern that limits what strings that properties of this type should be able to contain.
     */
    pattern?: string | null;
    enum?: StringEnumerationSettings;
});
