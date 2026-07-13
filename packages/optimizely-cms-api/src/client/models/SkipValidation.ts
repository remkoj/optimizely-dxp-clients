/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Indicates which content validation rules should be bypassed. Supported values are '*' (skip all validations), 'data' (skip data validation), and 'references' (skip reference validation). Values can be combined, empty or duplicated values are ignored, and any unknown values result in a validation error. Use with caution as this may allow creation of invalid content that could cause issues in production.
 */
export type SkipValidation = Array<'*' | 'data' | 'references'>;
