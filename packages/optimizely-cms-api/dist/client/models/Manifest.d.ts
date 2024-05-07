import type { ContentType } from './ContentType';
import type { PropertyGroup } from './PropertyGroup';
/**
 * Manifest that describest CMS definitions.
 */
export type Manifest = {
    /**
     * List of content type property groups.
     */
    propertyGroups?: Array<PropertyGroup>;
    /**
     * List of content types.
     */
    contentTypes?: Array<ContentType>;
    /**
     * A timestamp indicated when any item in this manifest was last modified.
     */
    readonly lastModified?: string;
};
