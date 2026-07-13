/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CompositionNodePatch } from './CompositionNodePatch';
import type { ContentDataPatch } from './ContentDataPatch';
/**
 * Represents the data part of a Blueprint.
 */
export type BlueprintDataPatch = (ContentDataPatch & {
    composition?: CompositionNodePatch;
});

