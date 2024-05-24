import type { DisplaySettingChoice } from './DisplaySettingChoice';
/**
 * Describes a setting for a display template.
 */
export type DisplaySetting = {
    /**
     * The display name of this display setting.
     */
    displayName: string;
    /**
     * The suggested editor for this display setting.
     */
    editor?: string;
    /**
     * The sort order of this display setting within the template.
     */
    sortOrder?: number;
    /**
     * The available choices for this display setting.
     */
    choices?: Record<string, DisplaySettingChoice>;
};
