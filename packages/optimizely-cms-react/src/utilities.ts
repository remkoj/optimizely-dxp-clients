import type { ComponentType } from 'react'
import type * as Types from './types.js'
import type { DocumentNode } from 'graphql'
import { localeToGraphLocale } from '@remkoj/optimizely-graph-client/utils'

export function isNonEmptyString(toTest: any) : toTest is string
{
    return typeof(toTest) == 'string' && toTest.length > 0
}

export function isNotNullOrUndefined<T>(toTest?: T | null) : toTest is T
{
    return !(toTest == null || toTest == undefined)
}

export function isContentType(toTest: any) : toTest is Types.ContentType
{
    if (!Array.isArray(toTest))
        return false

    return toTest.every(isNonEmptyString)
}

/**
 * Normalizes the content type by:
 *  - Converting strings to ContentType
 *  - Stripping the leading underscore, if any
 * 
 * @param       toNormalize         The Content Type value to process
 * @param       stripContent        When set to true, the global base type "Content" will be removed as well
 * @returns 
 */
export function normalizeContentType(toNormalize: (string | null)[] | string | null | undefined, stripContent: boolean = false) : Types.ContentType | undefined
{
    if (!toNormalize)
        return undefined

    let filtered = (typeof(toNormalize) == 'string' ? toNormalize.split('/') : toNormalize).filter(isNonEmptyString).map(x => x.startsWith('_') ? x.substring(1) : x)
    if (stripContent)
        filtered = filtered.filter(x => x.toLowerCase() != 'content')
    return filtered.length > 0 ? filtered : undefined
}

/**
 * Normalizes and prefixes the content type by:
 *  - Converting strings to ContentType
 *  - Stripping the leading underscore, if any
 *  - Removing the global base type "Content"
 *  - Ensuring that in the remaining type the least specific type is equal to the provided prefix
 * 
 * @param       contentType 
 * @param       prefix 
 * @returns 
 */
export function normalizeAndPrefixContentType(contentType: Array<string | null> | string | null | undefined, prefix: string) : Types.ContentType
{
    if (!contentType)
        return [ prefix ]

    const processedContentType = (typeof(contentType) == 'string' ? contentType.split('/') : contentType).filter(isNonEmptyString).map(x => x.startsWith('_') ? x.substring(1) : x).filter(x => x.toLowerCase() != 'content')
    if (processedContentType[0] != prefix)
        processedContentType.unshift(prefix)
    
    return processedContentType
}

export function isCmsComponentWithDataQuery<T = DocumentNode>(toTest?: Types.BaseCmsComponent<T>) : toTest is Types.CmsComponentWithQuery<T>
{
    const toTestType = typeof(toTest)
    if ((toTestType == 'function' || toTestType == 'object') && toTest != null)
    {
        return (toTest as Types.CmsComponentWithQuery).getDataQuery && typeof((toTest as Types.CmsComponentWithQuery).getDataQuery) == 'function' ? true : false
    }
    return false
}

export function isCmsComponentWithFragment<T = DocumentNode>(toTest?: Types.BaseCmsComponent<T>) : toTest is Types.CmsComponentWithFragment<T>
{
    const toTestType = typeof(toTest)
    if ((toTestType == 'function' || toTestType == 'object') && toTest != null)
        return (toTest as Types.CmsComponentWithFragment).getDataFragment && typeof((toTest as Types.CmsComponentWithFragment).getDataFragment) == 'function' ? true : false
    return false
}

export function validatesFragment<T extends ComponentType<any>>(toTest?: T) : toTest is T & Pick<Required<Types.WithGqlFragment<T, any>>,"validateFragment">
{
    type ToTestFor = T & Pick<Required<Types.WithGqlFragment<T, any>>,"validateFragment">
    const toTestType = typeof(toTest)
    if ((toTestType == 'function' || toTestType == 'object') && toTest != null)
        return (toTest as ToTestFor).validateFragment && typeof((toTest as ToTestFor).validateFragment) == 'function' ? true : false
    return false
}

export function contentLinkToRequestVariables(contentLink: Types.ContentLinkWithLocale) : Types.ContentQueryProps
{
    const variables : Types.ContentQueryProps = { 
        key: contentLink.key ?? '-no-content-selected-', 
        locale: contentLink.locale ? localeToGraphLocale(contentLink.locale) : undefined,
        version: contentLink.version
    }
    if (variables.version == undefined || variables.version == '')
        variables.version = null
    return variables
}

export function toUniqueValues<R extends any>(value: R, index: number, array: Array<R>) : value is R
{
    return array.indexOf(value) == index
}

export function trim<T extends string | null | undefined>(valueToTrim: T) : T
{
    if (typeof(valueToTrim) == 'string')
        return valueToTrim.trim() as T
    return valueToTrim
}

export function getContentEditId(contentLink: Types.ContentLink) : string 
{
    return contentLink.key
}

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
export function getRandomKey(prefix: string = "rnd") : string
{
    try {
        return `${prefix}::${crypto.randomUUID()}`
    } catch {
        return `${prefix}::${Math.round(Math.random() * 10000)}::${Math.round(Math.random() * 10000)}`
    }
}