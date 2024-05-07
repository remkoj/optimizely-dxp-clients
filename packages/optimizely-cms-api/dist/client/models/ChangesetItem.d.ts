import type { ContentReference } from './ContentReference';
/**
 * A writable implementation of an ChangesetItem.
 */
export type ChangesetItem = {
    reference: ContentReference;
    /**
     * Gets/sets item category.
     */
    category?: string;
};
