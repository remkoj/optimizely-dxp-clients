import 'server-only'
import type { ComponentType, ComponentProps } from 'react'
import type {  } from 'react'
import type { CmsComponent } from '../../types.js'
import type { CmsContentProps } from './types.js'
import getContentType from './get-content-type.js'
import getServerContext from '../context.js'
import createClient, { AuthMode, normalizeContentLink, contentLinkToString, isInlineContentLink, type ContentLink } from '@remkoj/optimizely-graph-client'
import { print } from 'graphql'
import * as Utils from "../../utilities.js"
import * as Queries from './queries.js'

type CmsComponentProps = ComponentProps<CmsComponent> & {
    [key: string]: any
}
type EnhancedCmsComponent = ComponentType<CmsComponentProps>

export type { CmsContentProps } from './types.js'

/**
 * React Server Side component for the CmsContent
 * 
 * @param     param0 
 * @returns   
 */
export const CmsContent = async <LocalesType = string>({contentType, contentTypePrefix, contentLink: rawContentLink, children, fragmentData, layoutProps, noDataLoad} : CmsContentProps<LocalesType>) : Promise<JSX.Element> => 
{
    let myContentType = contentType ? [ ...contentType ] : undefined
    const context = getServerContext()
    const contentLink = normalizeContentLink(rawContentLink)

    if (!contentLink) {
        if (context.isDebugOrDevelopment)
            console.warn(`🟠 [CmsContent] Invalid content link provided, not rendering anything`, rawContentLink)
        return <></>
    }

    if (context.isDebugOrDevelopment && !context.client)
        console.warn(`🟠 [CmsContent] No Content Graph client provided with ${ contentLinkToString(contentLink) }, this will cause problems with edit mode!`)

    // Parse & prepare props
    const isInline = isInlineContentLink(contentLink)
    const outputEditorWarning = context.forceEditorWarnings
    const factory = context.factory
    if (!factory) {
        console.error(`🔴 [CmsContent] No content type factory registered in the context`)
        throw new Error("Empty factory on the context")
    }

    const client = context.client ?? createClient()
    if (context.isDebug && context.inEditMode)
        console.log(`👔 [CmsContent] Edit mode active for content with id: ${ contentLinkToString(contentLink) }`)
    if (context.isDebug && context.inEditMode && client.currentAuthMode == AuthMode.Public)
        console.warn(`🟠 [CmsContent] Edit mode active without an authenticated client, this will cause problems`)
        
    // DEBUG Tracing
    if (context.isDebug)
        console.log("⚪ [CmsContent] Rendering CMS Content for:", JSON.stringify(myContentType), contentLinkToString(contentLink), context.inEditMode ? "edit-mode" : "published")

    // Ensure we have a content type to work with
    if (!myContentType) {
        if (isInline) {
            console.error(`🔴 [CmsContent] No content type provided for content ${ contentLinkToString(contentLink) }, content types cannot be resolved for inline content`)
            throw new Error("Unable to render Inline CMS Content without Content Type information")
        }
        if (context.isDebugOrDevelopment) 
            console.warn(`🟠 [CmsContent] No content type provided for content ${ contentLinkToString(contentLink) }, this causes an additional GraphQL query to resolve the myContentType`)
        myContentType = await getContentType(contentLink as ContentLink, client)
    }

    // Optimizely Graph stores the type in Most Significant first order, we need least significant first, also we're stripping out the common "Content" item from it
    if (Array.isArray(myContentType))
        myContentType = contentTypePrefix ?
            Utils.normalizeAndPrefixContentType(myContentType.reverse(), contentTypePrefix) :
            Utils.normalizeContentType(myContentType.reverse(), true)
    
    // Resolve component
    const Component = factory.resolve(myContentType ?? "") as EnhancedCmsComponent | undefined
    if (!Component) {
        if (context.isDebugOrDevelopment) {
            console.warn(`🟠 [CmsContent] Component of type "${ myContentType?.join('/') ?? "" }" not resolved by factory`)
        }
        if (context.isDebug || context.inEditMode || outputEditorWarning) {
            const errorMsg = <div className='opti-error'>Component of type "{ myContentType?.join('/') ?? "" }" not resolved by factory</div>
            return children ? <>{ errorMsg }{children}</> : errorMsg
        }
        return <>{children ? children : undefined }</>
    }
    if (context.isDebug)
        console.log("⚪ [CmsContent] Rendering item using component:", Component?.displayName ?? Component)

    // Render with previously loaded data
    const fragmentProps = fragmentData ? Object.getOwnPropertyNames(fragmentData).filter(x => !Queries.CmsContentFragments.IContentDataProps.includes(x)) : [] 
    if (fragmentProps.length > 0)
    {
        if (context.isDebug)
            console.log("⚪ [CmsContent] Rendering CMS Component using fragment information", fragmentProps)

        if (Utils.validatesFragment(Component) && !Component.validateFragment(fragmentData)) {
            console.error("🔴 [CmsContent] Invalid fragment data received for ", Component.displayName ?? myContentType?.join("/") ?? "[Undetermined component]")
            return <></>
        }
        return <Component contentLink={ contentLink } data={ fragmentData || {} } inEditMode={ context.inEditMode } layoutProps={ layoutProps } >{children}</Component>
    }

    if (isInline) {
        console.error(`🔴 [CmsContent] No data for content ${ contentLinkToString(contentLink) }, data cannot be resolved for inline content`)
        throw new Error(`Unable to render Inline CMS Content without data. (Content Type: ${ Component?.displayName ?? myContentType?.join('/') ?? "Unknown" }; Content Link: ${ contentLinkToString(contentLink )}; Data keys: ${ Object.getOwnPropertyNames(fragmentData ?? {}).join(", ")})`)
    }

    if (noDataLoad) {
        if (context.isDebug)
            console.log(`⚪ [CmsContent] Component of type "${ myContentType?.join('/') ?? Component.displayName ?? '?'}" was prohibited to load data`)
        return <Component contentLink={ contentLink as ContentLink } data={ fragmentData || {} } inEditMode={ context.inEditMode } layoutProps={ layoutProps } >{children}</Component>
    }

    // Render using included query 
    if (Utils.isCmsComponentWithDataQuery(Component)) {
        const gqlQuery = Component.getDataQuery()
        const gqlVariables = Utils.contentLinkToRequestVariables(contentLink as ContentLink)
        if (context.isDebug)
            console.log("⚪ [CmsContent] Component data fetching variables:", gqlVariables)
        const gqlResponse = await client.request<{}>(gqlQuery, gqlVariables)
        if (context.isDebug)
            console.log("⚪ [CmsContent] Component request the following data:", gqlResponse)
        return <Component contentLink={ contentLink as ContentLink } data={ gqlResponse } inEditMode={ context.inEditMode } layoutProps={ layoutProps } >{children}</Component>
    } 
    
    // Render using included fragment
    if (Utils.isCmsComponentWithFragment(Component)) {
        type FragmentQueryResponse = { contentById: { total: number, items: Array<any> }}
        const [name, fragment]  = Component.getDataFragment()
        if (context.isDebug) console.log(`⚪ [CmsContent] Component data fetching using fragment: ${ name }`)
        const fragmentQuery = `query getContentFragmentById($key: String!, $version: String, $locale: [Locales!]) {contentById: _Content(where: {_metadata: {key: { eq: $key }, version: { eq: $version }}} locale: $locale) { total, items { _type: __typename, _metadata { key, version, locale } ...${ name } }}} ${ print(fragment) }`
        const fragmentVariables = Utils.contentLinkToRequestVariables(contentLink as ContentLink)
        if (context.isDebug) console.log(`⚪ [CmsContent] Component data fetching using variables: ${ JSON.stringify(fragmentVariables) }`)
        const fragmentResponse = await client.request<FragmentQueryResponse, any>(fragmentQuery, fragmentVariables)
        const totalItems = fragmentResponse.contentById.total || 0
        if (totalItems < 1)
            throw new Error(`CmsContent expected to load exactly one content item of type ${ name }, received ${ totalItems } from Optimizely Graph. Content Item: ${ JSON.stringify( fragmentVariables )}`)
        if (totalItems > 1 && context.isDebug) console.warn(`🟠 [CmsContent] Resolved ${ totalItems } content items, expected only 1. Picked the first one`)
        return <Component contentLink={ contentLink as ContentLink } data={ fragmentResponse.contentById.items[0] } inEditMode={ context.inEditMode } layoutProps={ layoutProps } >{children}</Component>
    }
    
    // Assume there's no server side prepared data needed for the component
    if (context.isDebug)
        console.log(`⚪ [CmsContent] Component of type "${ myContentType?.join('/') ?? Component.displayName ?? '?'}" did not request pre-loading of data`)
    return <Component contentLink={ contentLink as ContentLink } data={ fragmentData || {} } inEditMode={ context.inEditMode } layoutProps={ layoutProps } >{children}</Component>
}

export default CmsContent