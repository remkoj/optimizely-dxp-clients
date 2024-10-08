/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Int32EnumerationSettings } from './Int32EnumerationSettings';
import type { ListPropertyItem } from './ListPropertyItem';
/**
 * Describes a property list item that can contain integers.
 */
export type IntegerListItem = (ListPropertyItem & {
    minimum?: number | null;
    maximum?: number | null;
    enum?: Int32EnumerationSettings;
});

