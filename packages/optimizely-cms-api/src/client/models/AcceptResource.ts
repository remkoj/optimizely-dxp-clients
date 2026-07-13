/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Indicates if the client accepts alternative response content in cases when the primary resource is unavailable. Empty and duplicated values are ignored. The order of values is ignored; When both are accepted, inherited resources take precedence over deleted resources. Unknown values are considered invalid.
 */
export type AcceptResource = Array<'*' | 'inherited' | 'deleted'>;
