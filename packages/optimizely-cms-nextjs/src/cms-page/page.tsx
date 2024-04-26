import 'server-only'
import type { Metadata, ResolvingMetadata } from 'next'
import deepmerge from 'deepmerge'
import { notFound } from 'next/navigation'
import { RouteResolver, type Route, type ClientFactory, type ChannelDefinition } from '@remkoj/optimizely-graph-client'
import { normalizeContentLinkWithLocale } from '@remkoj/optimizely-graph-client/utils'
import { CmsContent, isDebug, getServerContext, type ComponentFactory } from '@remkoj/optimizely-cms-react/rsc'
import { Utils } from '@remkoj/optimizely-cms-react'

import { MetaDataResolver } from '../metadata'
import { urlToPath, localeToGraphLocale } from './utils'
import getContentByPathBase, { type GetContentByPathMethod } from './data'
import { getServerClient } from '../client'

export type DefaultCmsPageParams = {
    path?: string[]
    lang?: string
}
export type DefaultCmsPageSearchParams = {}

export type DefaultCmsPageProps<
    TParams extends Record<string, string | Array<string> | undefined> = DefaultCmsPageParams,
    TSearchParams extends Record<string, string | Array<string> | undefined> = DefaultCmsPageSearchParams
> = {
    params: TParams
    searchParams: TSearchParams
}

export type OptiCmsNextJsPage<
    TParams extends Record<string, string | Array<string> | undefined> = DefaultCmsPageParams,
    TSearchParams extends Record<string, string | Array<string> | undefined> = DefaultCmsPageSearchParams
> = {
    generateStaticParams: () => Promise<TParams[]>
    generateMetadata: (props: DefaultCmsPageProps<TParams, TSearchParams>, resolving: ResolvingMetadata) => Promise<Metadata>
    CmsPage: (props: DefaultCmsPageProps<TParams, TSearchParams>) => Promise<JSX.Element>
}

export enum SystemLocales {
    All = 'ALL',
    Neutral = 'NEUTRAL'
}

export type CreatePageOptions<
    LocaleEnum = SystemLocales, 
    TParams extends Record<string, string | Array<string> | undefined> = DefaultCmsPageParams,
    TSearchParams extends Record<string, string | Array<string> | undefined> = DefaultCmsPageSearchParams
> = {
    defaultLocale: LocaleEnum | null
    getContentByPath: GetContentByPathMethod<LocaleEnum>
    client: ClientFactory
    channel?: ChannelDefinition
    propsToCmsPath: (props: DefaultCmsPageProps<TParams, TSearchParams>) => string | null
    propsToCmsLocale: (props: DefaultCmsPageProps<TParams, TSearchParams>, locale: LocaleEnum | null) => LocaleEnum | null
    routeToParams: (route: Route) => TParams
}

const CreatePageOptionDefaults : CreatePageOptions<string> = {
    defaultLocale: null,
    getContentByPath: getContentByPathBase,
    client: getServerClient,
    propsToCmsPath: ({ params }) => buildRequestPath(params),
    propsToCmsLocale: ({ params }, defaultLocale) => params?.lang ?? defaultLocale ?? null,
    routeToParams: (route) => { return { path: urlToPath(route.url, route.locale), lang: route.locale }}
}

/**
 * Generate the React Server Side component and Next.JS functions needed to render an 
 * Optimizely CMS page. This component assumes that the routes are either defined as
 * /[lang]/[[...path]] or /[[...path]]
 * 
 * @param       factory         The component factory to use for this page
 * @param       options         The page component generation options
 * @returns     The Optimizely CMS Page
 */
export function createPage<
    LocaleEnum = SystemLocales, 
    TParams extends Record<string, string | Array<string> | undefined> = DefaultCmsPageParams,
    TSearchParams extends Record<string, string | Array<string> | undefined> = DefaultCmsPageSearchParams
> (
    factory: ComponentFactory,
    options?: Partial<CreatePageOptions<LocaleEnum, TParams, TSearchParams>>
) : OptiCmsNextJsPage {
    const { defaultLocale, getContentByPath, client: clientFactory, channel, propsToCmsLocale, propsToCmsPath, routeToParams }= { 
        ...CreatePageOptionDefaults,
        ...options 
    } as CreatePageOptions<LocaleEnum>

    const pageDefintion : OptiCmsNextJsPage = {
        generateStaticParams : async () =>
        {
            const client = clientFactory()
            const resolver = new RouteResolver(client)
            return (await resolver.getRoutes()).map(r => routeToParams(r))
        },
        generateMetadata: async ( props, resolving ) =>
        {
            // Read variables from request            
            const client = clientFactory()
            const requestPath = propsToCmsPath(props)
            if (!requestPath)
                return Promise.resolve({})
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
        CmsPage: async (props) =>
        {
            // Prepare the context
            const context = getServerContext()
            const client = context.client ?? clientFactory()
            if (!context.client)
                context.setOptimizelyGraphClient(client)
            context.setComponentFactory(factory)

            // Analyze the locale
            const currentLocale = propsToCmsLocale(props, defaultLocale)
            const graphLocale = (currentLocale ? localeToGraphLocale(currentLocale as string, channel) : undefined) as LocaleEnum
            if (currentLocale)
                context.setLocale(currentLocale as string)

            // Resolve the content based upon the route
            const requestPath = propsToCmsPath(props)
            if (!requestPath)
                return notFound()
            const response = await getContentByPath(client, { path: requestPath, locale: graphLocale })
            const info = (response?.content?.items ?? [])[0]

            if (!info) {
                if (isDebug()) {
                    console.error(`🔴 [CmsPage] Unable to load content for ${ requestPath }, data received: `, response)
                }
                return notFound()
            }

            // Extract the type & link
            const contentType = Utils.normalizeContentType(info._metadata?.types)
            const contentLink = normalizeContentLinkWithLocale(info._metadata)
            if (contentLink?.locale)
                context.setLocale(contentLink?.locale as string)
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

/**
 * 
 * 
 * @param   param0  The URL parameters
 * @returns The request path as understood by Graph
 */
function buildRequestPath({ lang, path }: { lang?: string | null, path?: (string | null)[] | null } ) : string
{
    const slugs : string[] = []
    if (path) slugs.push(...(path.filter(x=>x) as string[]))
    if (lang) slugs.unshift(lang)
    if (slugs.length == 0) return '/'
    
    const fullPath = '/'+slugs.filter(x => x && x.length > 0).join('/')
    if (!slugs[slugs.length - 1].includes('.'))
        return fullPath + '/'
    return fullPath
}