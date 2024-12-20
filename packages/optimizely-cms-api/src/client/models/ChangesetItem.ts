/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentReference } from './ContentReference';
/**
 * Items in an changeset that contains a link to the specific content version.
 */
export type ChangesetItem = {
    reference: ContentReference;
    /**
     * Gets/sets the changeset item category.
     */
    category?: string;
};

