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
    minimum?: number | null;
    maximum?: number | null;
    enum?: DoubleEnumerationSettings;
});

