import 'server-only'
import type { Metadata, ResolvingMetadata } from 'next'
import deepmerge from 'deepmerge'
import { notFound } from 'next/navigation'
import { RouteResolver, type ClientFactory, type ChannelDefinition } from '@remkoj/optimizely-graph-client'
import { normalizeContentLink, normalizeContentLinkWithLocale } from '@remkoj/optimizely-graph-client/utils'
import { CmsContent, isDebug, getServerContext, type ComponentFactory } from '@remkoj/optimizely-cms-react/rsc'
import { Utils } from '@remkoj/optimizely-cms-react'

import { MetaDataResolver } from '../metadata'
import { urlToPath, localeToGraphLocale } from './utils'
import getContentByPathBase, { type GetContentByPathMethod } from './data'
import { getServerClient } from '../client'

export type Params = {
    path: string[] | undefined
}

export type Props = {
    params: Params
    searchParams: {}
}

export type GenerateMetadataProps<TParams extends {} = {}, TSearch extends {} = {}> = {
    params: Params
}

export type OptiCmsNextJsPage = {
    generateStaticParams: () => Promise<Params[]>
    generateMetadata: (props: Props, resolving: ResolvingMetadata) => Promise<Metadata>
    CmsPage: (props: Props) => Promise<JSX.Element>
}

export enum SystemLocales {
    All = 'ALL',
    Neutral = 'NEUTRAL'
}

export type CreatePageOptions<LocaleEnum = SystemLocales> = {
    defaultLocale: string | null
    getContentByPath: GetContentByPathMethod<LocaleEnum>
    client: ClientFactory
    channel?: ChannelDefinition
}

const CreatePageOptionDefaults : CreatePageOptions<string> = {
    defaultLocale: null,
    getContentByPath: getContentByPathBase,
    client: getServerClient
}

export function createPage<LocaleEnum = SystemLocales>(
    factory: ComponentFactory,
    options?: Partial<CreatePageOptions<LocaleEnum>>
) : OptiCmsNextJsPage {
    const { defaultLocale, getContentByPath, client: clientFactory, channel }= { 
        ...CreatePageOptionDefaults, 
        ...{ defaultLocale: null }, 
        ...options 
    } as CreatePageOptions<LocaleEnum>

    const pageDefintion : OptiCmsNextJsPage = {
        generateStaticParams : async () =>
        {
            const client = clientFactory()
            const resolver = new RouteResolver(client)
            return (await resolver.getRoutes()).map(r => { 
                return {
                    path: urlToPath(r.url)
                }
            })
        },
        generateMetadata: async ( { params: { path } }, resolving ) =>
        {
            // Read variables from request            
            const client = clientFactory()
            const requestPath = buildRequestPath({ path })
            const routeResolver = new RouteResolver(client)
            const metaResolver = new MetaDataResolver(client)

            // Resolve the route to a content link
            const route = await routeResolver.getContentInfoByPath(requestPath)
            if (!route)
                return Promise.resolve({})
            
            // Set context
            getServerContext().setLocale(localeToGraphLocale(route.locale, channel))
            getServerContext().setOptimizelyGraphClient(client)

            // Prepare metadata fetching
            const contentLink = routeResolver.routeToContentLink(route)
            const contentType = route.contentType
            const graphLocale = channel ? localeToGraphLocale(route.locale, channel) : null

            // Fetch the metadata based upon the actual content type and resolve parent
            const [pageMetadata, baseMetadata] = await Promise.all([
                metaResolver.resolve(factory, contentLink, contentType, graphLocale), 
                resolving
            ])

            // Make sure merging of objects goes correctly
            for (const metaKey of (Object.getOwnPropertyNames(pageMetadata) as (keyof Metadata)[]))
            {
                if (typeof(pageMetadata[metaKey]) == "object" && pageMetadata[metaKey] != null && baseMetadata[metaKey] != undefined && baseMetadata[metaKey] != null) {
                    //@ts-expect-error Silence error due to failed introspection...
                    pageMetadata[metaKey] = deepmerge(baseMetadata[metaKey], pageMetadata[metaKey], { arrayMerge: (target, source) => [...source] })
                }
            }

            // Not sure, but needed somehow...
            if (typeof(baseMetadata.metadataBase) == "string" && (baseMetadata.metadataBase as string).length > 1) {
                pageMetadata.metadataBase = new URL(baseMetadata.metadataBase)
            }
            return pageMetadata
        },
        CmsPage: async ({  params: { path } }) =>
        {
            // Prepare the context
            const context = getServerContext()
            const client = context.client ?? clientFactory()
            if (!context.client)
                context.setOptimizelyGraphClient(client)
            context.setComponentFactory(factory)

            // Resolve the content based upon the route
            const requestPath = buildRequestPath({ path })
            const response = await getContentByPath(client, { path: requestPath })
            const info = (response?.content?.items ?? [])[0]
            //context.setLocale(graphLocale)

            if (!info) {
                if (isDebug()) {
                    console.error(`🔴 [CmsPage] Unable to load content for ${ requestPath }, data received: `, response)
                }
                return notFound()
            }

            // Extract the type & link
            const contentType = Utils.normalizeContentType(info._metadata?.types)
            const contentLink = normalizeContentLinkWithLocale(info._metadata)
            if (!contentLink) {
                console.error("🔴 [CmsPage] Unable to infer the contentLink from the retrieved content, this should not have happened!")
                return notFound()
            }

            // Render the content link
            return <CmsContent contentType={ contentType } contentLink={ contentLink } fragmentData={ info } />
        }
    }
    
    return pageDefintion
}

function buildRequestPath({ lang, path }: { lang?: string | null, path?: (string | null)[] | null } ) : string
{
    const slugs : string[] = []
    if (path) slugs.push(...(path.filter(x=>x) as string[]))
    if (lang) slugs.unshift(lang)
    
    return '/'+slugs.filter(x => x && x.length > 0).join('/')
}