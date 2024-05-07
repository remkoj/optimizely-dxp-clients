import type { LocaleStatus } from './LocaleStatus';
/**
 * Describes information about a locale instance of a content item.
 */
export type ContentLocaleInfo = {
    /**
     * The display name of the content.
     */
    readonly displayName?: string;
    status?: LocaleStatus;
};