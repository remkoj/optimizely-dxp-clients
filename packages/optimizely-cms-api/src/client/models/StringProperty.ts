/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentTypeProperty } from './ContentTypeProperty';
import type { StringEnumerationSettings } from './StringEnumerationSettings';
/**
 * Describes a property that can contain strings.
 */
export type StringProperty = (ContentTypeProperty & {
    minLength?: number | null;
    maxLength?: number | null;
    pattern?: string | null;
    enum?: StringEnumerationSettings;
});

