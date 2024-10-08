/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentTypeProperty } from './ContentTypeProperty';
import type { Int32EnumerationSettings } from './Int32EnumerationSettings';
/**
 * Describes a property that can contain an integer.
 */
export type IntegerProperty = (ContentTypeProperty & {
    minimum?: number | null;
    maximum?: number | null;
    enum?: Int32EnumerationSettings;
});

