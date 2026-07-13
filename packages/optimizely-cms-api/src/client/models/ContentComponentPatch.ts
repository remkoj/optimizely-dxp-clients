/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentDataPatch } from './ContentDataPatch';
/**
 * Represents a content component.
 */
export type ContentComponentPatch = (ContentDataPatch & {
    /**
     * A reference to the content of this component. Cannot be assigned together with 'contentType' or 'properties'.
     */
    reference?: string | null;
    /**
     * The key of the content type that this is an embedded instance of.
     */
    contentType?: string | null;
});

