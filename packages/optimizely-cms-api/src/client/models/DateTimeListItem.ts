/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ListPropertyItem } from './ListPropertyItem';
/**
 * Describes a property list item that can contain a timestamp.
 */
export type DateTimeListItem = (ListPropertyItem & {
    /**
     * The earliest timestamp that list items of this type should be able to contain.
     */
    minimum?: string | null;
    /**
     * The latest timestamp that list items of this type should be able to contain.
     */
    maximum?: string | null;
});

