import { IntegrationApi } from '@remkoj/optimizely-cms-api';
import { keyToSlug, type KeyToSlugOptions } from './project.js';

/**
 * Test if the value must be included in a set, by defining allowed values and blocked values. A value
 * is considered be eligible to be included when it's both allowed an not disallowed.
 * 
 * @param value               The value to test
 * @param allow               The list of allowed values, when not provided, or and empty array, all 
 *                            values will be allowed.
 * @param disallow            The list of explicitly disallowed values, yielding an "all allowed but 
 *                            these" operation
 * @returns                   If the value should be included in the result, based upon the `allow` and
 *                            `disallow` configuration.
 */
export function shouldInclude<T>(value: T, allow?: T[] | null, disallow?: T[] | null): boolean;
/**
 * Test if the value must be included in a set, by defining allowed values and blocked values. A value
 * is considered be eligible to be included when it's both allowed an not disallowed.
 * 
 * @param value               The value to test
 * @param allow               The list of allowed values, when not provided, or and empty array, all 
 *                            values will be allowed.
 * @param disallow            The list of explicitly disallowed values, yielding an "all allowed but 
 *                            these" operation
 * @param compareSlugified    When set to `true`, and after test with `includes()` on the allow and 
 *                            disallow did not yield a match, will try to match by converting the 
 *                            values to string (using the `.toString()` method), then slugify them with 
 *                            the `keyToSlug` method and then comparing the outcomes.
 * @param slugifyOptions      The options to provide to the `keyToSlug` method, this will be ignored
 *                            unless you set the `compareSlugified` parameter to `true`
 * @returns                   If the value should be included in the result, based upon the `allow` and
 *                            `disallow` configuration.
 * 
 * @see {@link keyToSlug}
 */
export function shouldInclude<T>(value: T, allow: T[] | null, disallow: T[] | null, compareSlugified: true, slugifyOptions?: KeyToSlugOptions): boolean;
/**
 * Test if the value must be included in a set, by defining allowed values and blocked values. A value
 * is considered be eligible to be included when it's both allowed an not disallowed.
 * 
 * @param value               The value to test
 * @param allow               The list of allowed values, when not provided, or and empty array, all 
 *                            values will be allowed.
 * @param disallow            The list of explicitly disallowed values, yielding an "all allowed but 
 *                            these" operation
 * @param compareSlugified    When set to `true`, and after test with `includes()` on the allow and 
 *                            disallow did not yield a match, will try to match by converting the 
 *                            values to string (using the `.toString()` method), then slugify them with 
 *                            the `keyToSlug` method and then comparing the outcomes.
 * @param slugifyOptions      The options to provide to the `keyToSlug` method, this will be ignored
 *                            unless you set the `compareSlugified` parameter to `true`
 * @returns                   If the value should be included in the result, based upon the `allow` and
 *                            `disallow` configuration.
 * 
 * @see {@link keyToSlug}
 */
export function shouldInclude<T>(value: T, allow?: T[] | null, disallow?: T[] | null, compareSlugified: boolean = false, slugifyOptions?: KeyToSlugOptions) : boolean {
  // Do not include null or undefined values
  if (value === null || value === undefined) return false;
  // Item is allowed when either allow is not set, an empty array or has the value
  const isAllowed = !Array.isArray(allow) || allow.length === 0 || allow.includes(value) || (compareSlugified && allow.some(av => keyToSlug(av.toString(), slugifyOptions) === keyToSlug(value.toString(), slugifyOptions)));
  // Item is disallowed when and the array is set and includes the value
  const isDisallowed = Array.isArray(disallow) && (disallow.includes(value) || (compareSlugified && disallow.some(av => keyToSlug(av.toString(), slugifyOptions) === keyToSlug(value.toString(), slugifyOptions))));
  // Return the outcome
  return isAllowed && !isDisallowed;
}

/**
 * Test if the provided content type is a contract
 * 
 * @param     contentType     The ContentType to test
 * @returns   `true` if the ContentType is a contract, `false` otherwise
 * @see {@link IntegrationApi.ContentType}
 */
export function isContract(contentType?: (IntegrationApi.ContentType & { isContract?: boolean }) | null) : contentType is IntegrationApi.ContentType
{
  if (typeof contentType !== 'object' || contentType === null)
    return false;
  return contentType.isContract || contentType.source === 'globalcontract';
}

/**
 * Test if the provided content type comes from the Graph content source (e.g. external content)
 * 
 * @param     contentType     The ContentType to test
 * @returns   `true` if the ContentType is a graph type, `false` otherwise
 * @see {@link IntegrationApi.ContentType}
 */
export function isGraphType(contentType?: (IntegrationApi.ContentType & { isContract?: boolean }) | null) : contentType is IntegrationApi.ContentType
{
  if (typeof contentType !== 'object' || contentType === null)
    return false;
  return (contentType.key && typeof(contentType.key) === 'string' && contentType.key.startsWith('graph:')) || contentType.source === 'graph';
}

/**
 * Test if the provided content type is a folder, which is a structural element for editors, but
 * does not represent anything significant when working with ContentType
 * 
 * @param     contentType     The ContentType to test
 * @returns   `true` if the ContentType is a folder, `false` otherwise
 * @see {@link IntegrationApi.ContentType}
 */
export function isFolder(contentType?: (IntegrationApi.ContentType & { isContract?: boolean }) | null) : contentType is IntegrationApi.ContentType
{
  if (typeof contentType !== 'object' || contentType === null)
    return false;
  return contentType.baseType === '_folder'
}

/**
 * Test if the provided content type is a system type
 * 
 * @param     contentType     The ContentType to test
 * @returns   `true` if the ContentType is a system type, `false` otherwise
 * @see {@link IntegrationApi.ContentType}
 */
export function isSystemType(contentType?: (IntegrationApi.ContentType & { isContract?: boolean }) | null) : contentType is IntegrationApi.ContentType
{
  if (typeof contentType !== 'object' || contentType === null)
    return false;
  return contentType.source === 'system'
}

/**
 * Type guard that returns `true` when `toTest` is a non-empty array.
 *
 * @param toTest The value to inspect.
 * @returns `true` when `toTest` is an `Array` with at least one element.
 */
export function isNonEmptyArray<T>(toTest?: Array<T> | null | undefined): toTest is Array<T> {
  return Array.isArray(toTest) && toTest.length > 0;
}

/**
 * Type guard that returns `true` when `toTest` is `null`, `undefined`, or an empty array.
 *
 * @param toTest The value to inspect.
 * @returns `true` when `toTest` is `null` or an `Array` with no elements.
 */
export function isEmptyArray<T>(toTest?: Array<T> | null | undefined): toTest is Array<T> | null {
  return toTest === null || !Array.isArray(toTest) || toTest.length === 0;
}

/**
 * Type guard that returns `true` when `toTest` is neither `null` nor `undefined`.
 *
 * @param toTest The value to inspect.
 * @returns `true` when `toTest` is a defined, non-null value of type `T`.
 */
export function isDefined<T>(toTest?: T | null | void): toTest is T
{
  return toTest !== null && toTest !== undefined
}
