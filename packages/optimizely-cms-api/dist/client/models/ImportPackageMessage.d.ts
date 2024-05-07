/**
 * Describes a message from a package importing operation.
 */
export type ImportPackageMessage = {
    /**
     * The section where the message originated from.
     */
    readonly section?: string | null;
    /**
     * The message describing an outcome.
     */
    readonly message?: string;
    /**
     * The identifier of the resource that was the reason for this message to be created.
     */
    readonly identifier?: string | null;
};
