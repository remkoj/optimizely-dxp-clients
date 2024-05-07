import type { ImportPackageMessage } from './ImportPackageMessage';
/**
 * Describes the result of a data package import.
 */
export type ImportPackageResult = {
    /**
     * Indication if the import succeeded.
     */
    readonly success?: boolean;
    /**
     * List of messages describing the outcome from the package import.
     */
    outcomes?: Array<ImportPackageMessage>;
    /**
     * List of error messages from the package import.
     */
    errors?: Array<ImportPackageMessage>;
    /**
     * List of warning messages from the package import.
     */
    warnings?: Array<ImportPackageMessage>;
};
