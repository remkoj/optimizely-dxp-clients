/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ComponentListItem } from './ComponentListItem';
import type { ContentListItem } from './ContentListItem';
import type { ContentReferenceListItem } from './ContentReferenceListItem';
import type { ContentTypeProperty } from './ContentTypeProperty';
import type { DateTimeListItem } from './DateTimeListItem';
import type { FloatListItem } from './FloatListItem';
import type { IntegerListItem } from './IntegerListItem';
import type { StringListItem } from './StringListItem';
import type { UrlListItem } from './UrlListItem';
/**
 * A property in the CMS that may hold a list of items.
 */
export type ListProperty = (ContentTypeProperty & {
    /**
     * Specifies the minimum number of items in this array property.
     */
    minItems?: number | null;
    /**
     * Specifies the maximum number of items in this array property.
     */
    maxItems?: number | null;
    /**
     * Describes the list item of a ListProperty in the CMS.
     */
    items: (ComponentListItem | ContentListItem | ContentReferenceListItem | DateTimeListItem | FloatListItem | IntegerListItem | StringListItem | UrlListItem);
});

