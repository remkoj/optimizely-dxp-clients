/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ListPropertyItem } from './ListPropertyItem';
import type { StringEnumerationSettings } from './StringEnumerationSettings';
/**
 * Describes a property list item that can contain a string.
 */
export type StringListItem = (ListPropertyItem & {
    minLength?: number | null;
    maxLength?: number | null;
    pattern?: string | null;
    enum?: StringEnumerationSettings;
});

