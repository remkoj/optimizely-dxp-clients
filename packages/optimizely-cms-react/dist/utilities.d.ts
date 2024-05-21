import type { ComponentType } from 'react';
import type * as Types from './types.js';
import type { DocumentNode } from 'graphql';
export declare function isNonEmptyString(toTest: any): toTest is string;
export declare function isNotNullOrUndefined<T>(toTest?: T | null): toTest is T;
export declare function isContentType(toTest: any): toTest is Types.ContentType;
export declare function normalizeContentType(toNormalize: (string | null)[] | null | undefined): Types.ContentType | undefined;
export declare function isCmsComponentWithDataQuery<T = DocumentNode>(toTest?: Types.BaseCmsComponent<T>): toTest is Types.CmsComponentWithQuery<T>;
export declare function isCmsComponentWithFragment<T = DocumentNode>(toTest?: Types.BaseCmsComponent<T>): toTest is Types.CmsComponentWithFragment<T>;
export declare function validatesFragment<T extends ComponentType<any>>(toTest?: T): toTest is T & Pick<Required<Types.WithGqlFragment<T, any>>, "validateFragment">;
export declare function contentLinkToRequestVariables(contentLink: Types.ContentLinkWithLocale): Types.ContentQueryProps;
export declare function toUniqueValues<R extends any>(value: R, index: number, array: Array<R>): value is R;
export declare function trim<T extends string | null | undefined>(valueToTrim: T): T;
export declare function getContentEditId(contentLink: Types.ContentLink): string;
/**
 * Generate a pseudo-random identifier usable to satisfy the unique key
 * requirement for children within a React node. However this effectively will
 * tell React that the childrend will be unique for each render and thus cause
 * them to update.
 *
 * Only use this method to generate keys if there's no other way to test the
 * uniqueness of the child
 *
 * @param       prefix      The prefix to apply to the children
 * @returns     The unique key
 */
export declare function getRandomKey(prefix?: string): string;
