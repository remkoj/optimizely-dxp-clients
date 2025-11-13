/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PinnedItemPayload = {
    /**
     * Phrase or keyword to match
     */
    phrases: string;
    /**
     * Document id to pin
     */
    targetKey: string;
    /**
     * Language code (e.g. `en`, `fr`, `de`, etc.)
     *
     * - `null` value means the pinned item is applicable to all languages
     *
     * - Empty string (`""`) value is for NEUTRAL locale
     */
    language?: string | null;
    /**
     * Priority of the pinned item (lower number means lower priority)
     *
     * - Default value is `1000`
     *
     * - Example: `1`, `10`, `100`, etc.
     */
    priority?: number;
    isActive?: boolean;
};

