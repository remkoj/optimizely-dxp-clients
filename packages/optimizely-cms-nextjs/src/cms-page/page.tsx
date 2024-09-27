import 'server-only'
import type { Metadata, ResolvingMetadata } from 'next'
import deepmerge from 'deepmerge'
import { notFound } from 'next/navigation.js'
import { RouteResolver, type IRouteResolver, type Route } from '@remkoj/optimizely-graph-client/router'
import { type ChannelDefinition } from '@remkoj/optimizely-graph-client/channels'
import { type ClientFactory, type IOptiGraphClient, OptiCmsSchema } from '@remkoj/optimizely-graph-client/client'
import { normalizeContentLinkWithLocale } from '@remkoj/optimizely-graph-client/utils'
import { CmsContent, isDebug, getServerContext, type ComponentFactory } from '@remkoj/optimizely-cms-react/rsc'
import { Utils } from '@remkoj/optimizely-cms-react'

import { MetaDataResolver } from '../metadata.js'
import { urlToPath, localeToGraphLocale, slugToGraphLocale, slugToLocale, localeToSlug } from './utils.js'
import getContentByPathBase, { type GetContentByPathMethod, type GetContentByPathVariables } from './data.js'
import { getServerClient } from '../client.js'

export type DefaultCmsPageParams = {
    path?: string[]
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
    routerFactory: (client?: IOptiGraphClient) => IRouteResolver

    /**
     * Take the props received by the CmsPage from Next.JS and tranform those
     * into a path that will be understood by Optimizely CMS
     * 
     * @param       props       The Properties (slugs & search params) received by Next.JS
     * @return      The path to be retrieved from Router or getContentByPath function
     */
    propsToCmsPath: (props: DefaultCmsPageProps<TParams, TSearchParams>) => string | null

    /**
     * Take the route from the Routing Service and transform that to the route params used by Next.JS. This defaults
     * to building a single 'path' parameter, being a string array
     * 
     * @param       route       The Route retrieved from Optimizely Graph
     * @returns     The processed route
     */
    routeToParams: (route: Route) => TParams
}

const CreatePageOptionDefaults : CreatePageOptions<string> = {
    defaultLocale: null,
    getContentByPath: getContentByPathBase,
    client: getServerClient,
    routerFactory: (client) => new RouteResolver(client),
    propsToCmsPath: ({ params }) => buildRequestPath(params),
    routeToParams: (route) => { return { path: urlToPath(route.url), lang: route.locale }}
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

    // Build the global/shared configuration for the Optimizely CMS Page
    const { defaultLocale, getContentByPath, client: clientFactory, channel, propsToCmsPath, routeToParams, routerFactory } = { 
        ...CreatePageOptionDefaults,
        ...options 
    } as CreatePageOptions<LocaleEnum>
    const globalClient = clientFactory()
    const router = routerFactory(globalClient)

    const pageDefintion : OptiCmsNextJsPage = {
        generateStaticParams : async () =>
        {
            return (await router.getRoutes()).map(r => routeToParams(r))
        },
        generateMetadata: async ( props, resolving ) =>
        {
            // Prepare the context
            const context = getServerContext()
            const client = context.client ?? globalClient
            if (!context.client)
                context.setOptimizelyGraphClient(client)
            context.setComponentFactory(factory)

            // Read variables from request    
            const siteId = channel ? (client.currentOptiCmsSchema == OptiCmsSchema.CMS12 ? channel.id : channel.defaultDomain) : undefined
            const requestPath = propsToCmsPath(props)
            if (!requestPath) return Promise.resolve({})
            if (isDebug())
                console.log(`⚪ [CmsPage.generateMetadata] Processed Next.JS route: ${ JSON.stringify(props) } => Optimizely CMS route: ${ JSON.stringify({ path: requestPath, siteId })}`)

            // Resolve the route to a content link
            const route = await router.getContentInfoByPath(requestPath, siteId)
            if (!route)
                return Promise.resolve({})
            if (isDebug())
                console.log(`⚪ [CmsPage.generateMetadata] Retrieved content info:`, route)
            
            // Update context
            getServerContext().setLocale(route.locale)

            // Prepare metadata fetching
            const contentLink = router.routeToContentLink(route)
            const contentType = route.contentType
            const graphLocale = localeToGraphLocale(route.locale, channel)

            // Fetch the metadata based upon the actual content type and resolve parent
            const metaResolver = new MetaDataResolver(globalClient)
            const [pageMetadata, baseMetadata] = await Promise.all([
                metaResolver.resolve(factory, contentLink, contentType, graphLocale), 
                resolving
            ])
            
            if (isDebug())
                console.log(`⚪ [CmsPage.generateMetadata] Component yielded metadata:`, pageMetadata)

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
            const client = context.client ?? globalClient
            if (!context.client)
                context.setOptimizelyGraphClient(client)
            context.setComponentFactory(factory)

            // Analyze the Next.JS Request props
            const requestPath = propsToCmsPath(props)
            if (isDebug())
                console.log(`⚪ [CmsPage] Processed Next.JS route: ${ JSON.stringify(props) } => Optimizely CMS route: ${ JSON.stringify({ path: requestPath })}`)

            // If we don't have the path, or the path is an internal Next.JS route reject it.
            if (!requestPath || requestPath.startsWith('/_next/'))
                return notFound()

            // Resolve the content based upon the path
            const requestVars = {
                path: requestPath,
                siteId: channel ? (client.currentOptiCmsSchema == OptiCmsSchema.CMS12 ? channel.id : channel.defaultDomain) : null
            }
            if (isDebug())
                console.log(`⚪ [CmsPage] Processed Next.JS route: ${ JSON.stringify(props) } => getContentByPath Variables: ${ JSON.stringify(requestVars)}`)

            const response = await getContentByPath(client, requestVars)
            const info = (response?.content?.items ?? [])[0]

            if (!info) {
                if (isDebug()) {
                    console.error(`🔴 [CmsPage] Unable to load content for ${ requestPath }, data received: `, response)
                }
                return notFound()
            } else if (isDebug() && (response?.content?.items ?? []).length > 1) {
                console.warn(`🟠 [CmsPage] Resolving content for ${ requestPath }, yielded ${ (response?.content?.items ?? []).length } items, picked:`, info)
            }

            // Extract the type & link
            const contentType = Utils.normalizeContentType(info._metadata?.types)
            const contentLink = normalizeContentLinkWithLocale(info._metadata)
            if (!contentLink) {
                console.error("🔴 [CmsPage] Unable to infer the contentLink from the retrieved content, this should not have happened!")
                return notFound()
            }
            if (contentLink?.locale)
                context.setLocale(contentLink?.locale as string)

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