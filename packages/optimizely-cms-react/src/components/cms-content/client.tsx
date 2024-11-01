"use client"
import { type ReactNode } from 'react'
import { ContentType } from '../../types.js'
import type { BaseCmsContentProps } from './types.js'
import getContentType from './get-content-type.js'
import getContent from './get-content.js'
import { AuthMode, normalizeContentLink, contentLinkToString, type ContentLink } from '@remkoj/optimizely-graph-client'
import resolveComponent, { isComponentMissingComponent } from './resolve-component.js'
import resolveContentType from './resolve-content-type.js'

import { useState, useMemo, useEffect }  from 'react'

export type * from "./types.js"

/**
 * React Server Side component for the CmsContent
 * 
 * @param     param0 
 * @returns   
 */
export function CmsContent<LocalesType = string>({
    // Own properties
    contentType, 
    contentTypePrefix, 
    contentLink: rawContentLink, 
    children, 
    fragmentData, 
    layoutProps, 
    noDataLoad,
    ctx
} : BaseCmsContentProps<LocalesType>) : ReactNode
{
    // Prepare context
    const graphClient = ctx.client
    const [myContentType, setMyContentType] = useState<ContentType | undefined>(resolveContentType(contentType, fragmentData))
    const contentLink = useMemo(() => normalizeContentLink(rawContentLink), [rawContentLink])
    const Component = useMemo(() => resolveComponent(myContentType, contentTypePrefix, ctx), [myContentType, contentTypePrefix, ctx])
    const [data, setData] = useState<Record<string,any>>(getContent(graphClient, contentLink, Component, fragmentData, true))
    
    // Provide a bit of debugging context
    if (graphClient?.debug) {
        const mode = ctx.inEditMode ? "Edit" : ctx.inPreviewMode ? "Preview" : "Public"
        console.log(`👔 [CmsContent] ${ mode } mode active for content with id: ${ contentLinkToString(contentLink) } of type ${ myContentType?.join("/") ?? "unknown"}`)
        if ((ctx.inEditMode || ctx.inPreviewMode) && graphClient.currentAuthMode == AuthMode.Public)
            console.warn(`🟠 [CmsContent] ${ mode } mode active without an authenticated graphClient, this will cause problems. Make sure the context has an authenticated client.`)
    }

    // Ensure we have a content type to work with
    useEffect(() => {
        let isCancelled : boolean = false
        if (myContentType || !contentLink) 
            return

        if (!graphClient) {
            console.warn(`🔴 [CmsContent] No Optimizely Graph Client present unable to load content type`)
            return
        }

        if (graphClient.debug) 
            console.warn(`🟠 [CmsContent] No content type provided for content ${ contentLinkToString(contentLink) }, this causes an additional GraphQL query to resolve the myContentType`)

        getContentType(contentLink, graphClient).then(ct => {
            if (!isCancelled) setMyContentType(ct)
        })
        
        return () => {
            isCancelled = true
        }
    }, [ myContentType, contentLink, graphClient])

    useEffect(() => {
        let isCancelled : boolean = false

        // Only load if load hasn't been disabled, and we have both the contentLink and Component
        if (noDataLoad || !contentLink || !Component)
            return

        if (!graphClient) {
            console.warn(`🔴 [CmsContent] No Optimizely Graph Client present unable to load content type`)
            return
        }
        getContent(graphClient, contentLink, Component, fragmentData).then(newData => {
            if (!isCancelled) setData(newData)
        })

        return () => {
            isCancelled = true
        }
    }, [graphClient, contentLink, Component, fragmentData, noDataLoad])

    if (isComponentMissingComponent(Component))
        return <Component />
    return <Component contentLink={ contentLink as ContentLink } data={ data } inEditMode={ ctx.inEditMode } layoutProps={ layoutProps } >{children}</Component>
}

export default CmsContent