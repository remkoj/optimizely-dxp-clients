/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ManifestImportMessage } from './ManifestImportMessage';
/**
 * The result of a manifest import operation.
 */
export type ManifestImportResult = {
    /**
     * List of messages describing the outcome from the manifest import.
     */
    readonly outcomes?: Array<ManifestImportMessage>;
    /**
     * List of error messages from the manifest import.
     */
    readonly errors?: Array<ManifestImportMessage>;
};

