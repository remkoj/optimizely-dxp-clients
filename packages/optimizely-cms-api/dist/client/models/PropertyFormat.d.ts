import type { PropertyDataType } from './PropertyDataType';
/**
 * Represent the definition of semantic property formats for content items.
 */
export type PropertyFormat = {
    /**
     * The key that identifies this PropertyFormat.
     */
    key?: string;
    dataType?: PropertyDataType;
    itemType?: PropertyDataType;
    /**
     * The name and identifier of this PropertyFormat.
     */
    displayName?: string;
    /**
     * Editor used for managing properties with this format.
     */
    editor?: string | null;
    deleted?: boolean;
    /**
     * Settings for the editor.
     */
    editorSettings?: Record<string, Record<string, any>> | null;
    /**
     * Enumerations for the format.
     */
    enum?: {
        values?: Array<{
            value?: (string | number);
            displayName?: string;
        }>;
    } | null;
};
