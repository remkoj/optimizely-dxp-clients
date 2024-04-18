import type { ComponentType } from 'react'
import type * as Types from './types'
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

export function normalizeContentType(toNormalize: (string | null)[] | null | undefined) : Types.ContentType | undefined
{
    if (!Array.isArray(toNormalize))
        return undefined

    const filtered = toNormalize.filter(isNonEmptyString)
    return filtered.length > 0 ? filtered : undefined
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