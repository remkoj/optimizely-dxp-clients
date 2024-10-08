/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PackageJobMessage } from './PackageJobMessage';
import type { PackageJobStatus } from './PackageJobStatus';
/**
 * Describes the status of a package job.
 */
export type PackageJob = {
    /**
     * An unique key that can be used to track the staus of a package job.
     */
    readonly key?: string;
    status?: PackageJobStatus;
    /**
     * List of messages describing the outcome from the package job.
     */
    outcomes?: Array<PackageJobMessage>;
    /**
     * List of error messages from the package job.
     */
    errors?: Array<PackageJobMessage>;
    /**
     * List of warning messages from the package job.
     */
    warnings?: Array<PackageJobMessage>;
    /**
     * A timestamp indicates when this task was first created.
     */
    readonly created?: string;
};

