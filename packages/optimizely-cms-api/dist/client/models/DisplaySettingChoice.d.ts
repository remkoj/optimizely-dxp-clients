/**
 * Describes a setting for a display template.
 */
export type DisplaySettingChoice = {
    /**
     * The display name of this display setting.
     */
    displayName: string;
    /**
     * The sort order of this choice within the setting.
     */
    sortOrder?: number;
};
