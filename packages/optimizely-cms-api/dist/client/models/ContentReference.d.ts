/**
 * A reference to a specific content instance.
 */
export type ContentReference = {
    /**
     * The content key that identifies the content.
     */
    readonly key?: string;
    /**
     * The name of the content locale
     */
    readonly locale?: string;
    /**
     * The identifier of a specific version of the content.
     */
    readonly version?: string;
};
