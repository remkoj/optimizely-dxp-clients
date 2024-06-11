/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DoubleEnumerationSettings } from './DoubleEnumerationSettings';
import type { ListPropertyItem } from './ListPropertyItem';
/**
 * Describes a property list item that can contain a float number.
 */
export type FloatListItem = (ListPropertyItem & {
    minimum?: number | null;
    maximum?: number | null;
    enum?: DoubleEnumerationSettings;
});

