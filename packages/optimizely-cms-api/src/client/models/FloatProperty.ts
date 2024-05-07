/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentTypeProperty } from './ContentTypeProperty';
import type { DoubleEnumerationSettings } from './DoubleEnumerationSettings';
/**
 * Describes a property that can contain a float number.
 */
export type FloatProperty = (ContentTypeProperty & {
    /**
     * The minimum value that properties of this type should be able to contain.
     */
    minimum?: number | null;
    /**
     * The maximum value that properties of this type should be able to contain.
     */
    maximum?: number | null;
    enum?: DoubleEnumerationSettings;
});

