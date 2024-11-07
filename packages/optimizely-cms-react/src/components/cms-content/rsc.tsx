import { type ReactNode } from 'react'
import type { BaseCmsContentProps } from './types.js'
import getContentType from './get-content-type.js'
import getContent from './get-content.js'
import { AuthMode, normalizeContentLink, contentLinkToString, type ContentLink } from '@remkoj/optimizely-graph-client'
import resolveComponent, { isComponentMissingComponent } from './resolve-component.js'
import resolveContentType from './resolve-content-type.js'

export type * from "./types.js"

/**
 * React Server Side component for the CmsContent
 * 
 * @param     param0 
 * @returns   
 */
export async function CmsContent<LocalesType = string>({
    // Own properties
    contentType, 
    contentTypePrefix, 
    contentLink: rawContentLink, 
    children, 
    fragmentData, 
    layoutProps, 
    noDataLoad,
    variant,
    ctx
} : BaseCmsContentProps<LocalesType>) : Promise<ReactNode>
{
    // Prepare context
    const graphClient = ctx.client

    // Normalize the ContentLink
    const contentLink = normalizeContentLink(rawContentLink)

    // Ensure we have the contentType
    let myContentType = resolveContentType(contentType, fragmentData)
    if (!myContentType) {
        if (!graphClient) {
            console.error(`🔴 [CmsContent] Unable to load content type - no Optimizely Graph client present`)
            return
        }
        if (!contentLink) {
            console.error(`🔴 [CmsContent] Unable to load content type - no content link present`)
            return
        }
        myContentType = await getContentType(contentLink, graphClient)
    }
    
    // Provide a bit of debugging context
    if (graphClient?.debug) {
        const mode = ctx.inEditMode ? "Edit" : ctx.inPreviewMode ? "Preview" : "Public"
        console.log(`👔 [CmsContent] ${ mode } mode active for content with id: ${ contentLinkToString(contentLink) } of type ${ myContentType?.join("/") ?? "unknown"}`)
        if ((ctx.inEditMode || ctx.inPreviewMode) && graphClient.currentAuthMode == AuthMode.Public)
            console.warn(`🟠 [CmsContent] ${ mode } mode active without an authenticated graphClient, this will cause problems. Make sure the context has an authenticated client.`)
    }

    // Retrieve the Component used to render this item
    const Component = resolveComponent(myContentType, contentTypePrefix, variant, ctx)
    if (isComponentMissingComponent(Component))
        return <Component />

    // Ensure we have the data the Component requested
    const data = await getContent(graphClient, contentLink, Component, fragmentData, noDataLoad)

    // Output the actual component
    return <Component contentLink={ contentLink as ContentLink } data={ data } inEditMode={ ctx.inEditMode } layoutProps={ layoutProps } >{children}</Component>
}

export default CmsContent