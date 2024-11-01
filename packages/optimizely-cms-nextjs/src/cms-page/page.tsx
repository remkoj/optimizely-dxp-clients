import 'server-only'
import type { Metadata, ResolvingMetadata } from 'next'
import deepmerge from 'deepmerge'
import { notFound } from 'next/navigation.js'

// GraphQL Client & Services
import { type ContentLinkWithLocale } from '@remkoj/optimizely-graph-client'
import { RouteResolver, type IRouteResolver, type Route } from '@remkoj/optimizely-graph-client/router'
import { type ChannelDefinition } from '@remkoj/optimizely-graph-client/channels'
import { type ClientFactory, type IOptiGraphClient, OptiCmsSchema } from '@remkoj/optimizely-graph-client/client'
import { normalizeContentLinkWithLocale } from '@remkoj/optimizely-graph-client/utils'

// React Support
import { CmsContent, Utils, isDebug, getServerContext, type ComponentFactory } from '@remkoj/optimizely-cms-react/rsc'

// Within package
import { MetaDataResolver } from '../metadata.js'
import { urlToPath, localeToGraphLocale } from './utils.js'
import getContentByPathBase, { type GetContentByPathMethod } from './data.js'
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
    /**
     * Default implementation for the `generateStaticParams` export of a
     * Next.JS Page.
     * 
     * @returns     The list of routes that should be pre-rendered by Next.JS
     */
    generateStaticParams: () => Promise<TParams[]>

    /**
     * Default implementation for the `generateMetadata` export, which builds 
     * the metadata for the given route within the Next.JS app.
     * 
     * @param       props           The properties of the page
     * @param       resolving       The metadata that is currently resolving
     * @returns     Updated metadat
     */
    generateMetadata: (props: DefaultCmsPageProps<TParams, TSearchParams>, resolving: ResolvingMetadata) => Promise<Metadata>

    /**
     * The actual component that performs the page rendering
     * 
     * @param       props           The properties of the page
     * @returns     The component to render the page
     */
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
    /**
     * Main function used to retrieve the content by path
     */
    getContentByPath: GetContentByPathMethod<LocaleEnum>

    /**
     * The factory that should yield the GraphQL Client to be used within this
     * page.
     */
    client: ClientFactory

    /**
     * The channel information used to resolve locales, domains and more
     */
    channel?: ChannelDefinition

    /**
     * Override the default RouteResolver that is used to discover the routes
     * provided by the Optimizely CMS and to retrieve the content reference for
     * each route.
     * 
     * @param       client      The Optimizely GraphQL Client to use
     * @returns     The RouteResolver to use
     */
    routerFactory: (client?: IOptiGraphClient) => IRouteResolver

    /**
     * Take the props received by the CmsPage from Next.JS and tranform those
     * into a path that will be understood by Optimizely CMS. The default 
     * implementation works with both `/[lang]/[[...path]]` as well as
     * `/[[...path]]`
     * 
     * @param       props       The Properties (slugs & search params) received 
     *                          by Next.JS
     * @return      The path to be retrieved from Router or getContentByPath 
     *              function
     */
    propsToCmsPath: (props: DefaultCmsPageProps<TParams, TSearchParams>) => string | null

    /**
     * Take the route from the Routing Service and transform that to the route 
     * params used by Next.JS. The default implementation assumes that the CMS
     * routes will be handled by `/[[...path]]`
     * 
     * @param       route       The Route retrieved from Optimizely Graph
     * @returns     The processed route
     */
    routeToParams: (route: Route) => TParams
}

const CreatePageOptionDefaults : CreatePageOptions<string> = {
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
) : OptiCmsNextJsPage<TParams, TSearchParams> {

    // Build the global/shared configuration for the Optimizely CMS Page
    const { getContentByPath, client: clientFactory, channel, propsToCmsPath, routeToParams, routerFactory } = { 
        ...CreatePageOptionDefaults,
        ...options 
    } as CreatePageOptions<LocaleEnum, TParams, TSearchParams>

    // Create the global Graph Client
    const globalClient = clientFactory()

    // Create the global Router instance
    const router = routerFactory(globalClient)
    const getInfoByPath = async (requestPath: string, siteId?: string) => {
        const route = await router.getContentInfoByPath(requestPath, siteId)
        if (!route)
            return undefined
        const contentLink = router.routeToContentLink(route)
        const contentType = route.contentType
        const graphLocale = localeToGraphLocale(route.locale, channel)
        return [route, contentLink, contentType, graphLocale] as [Route, ContentLinkWithLocale, string[], string]
    }

    const pageDefintion : OptiCmsNextJsPage<TParams, TSearchParams> = {
        generateStaticParams : async () => (await router.getRoutes()).map(r => routeToParams(r)),
        generateMetadata: async ( props, parent ) =>
        {
            // Read variables from request    
            const siteId = channel ? (globalClient.currentOptiCmsSchema == OptiCmsSchema.CMS12 ? channel.id : channel.defaultDomain) : undefined
            const requestPath = propsToCmsPath(props)
            if (!requestPath) return Promise.resolve({})
            if (isDebug())
                console.log(`⚪ [CmsPage.generateMetadata] Processed Next.JS route: ${ JSON.stringify(props) } => Optimizely CMS route: ${ JSON.stringify({ path: requestPath, siteId })}`)

            // Resolve the route to a content link
            const routeInfo = await getInfoByPath(requestPath, siteId)
            if (!routeInfo) {
                if (isDebug())
                    console.log('⚪ [CmsPage.generateMetadata] No data received')
                return Promise.resolve({})
            }
            const [ route, contentLink, contentType, graphLocale ] = routeInfo
            if (isDebug())
                console.log(`⚪ [CmsPage.generateMetadata] Retrieved content info:`, route)

            // Update context
            const context = getServerContext()
            context.setOptimizelyGraphClient(globalClient)
            context.setComponentFactory(factory)
            context.setLocale(route.locale)

            // Fetch the metadata based upon the actual content type and resolve parent
            const metaResolver = new MetaDataResolver(globalClient)
            const [pageMetadata, baseMetadata] = await Promise.all([
                metaResolver.resolve(factory, contentLink, contentType, graphLocale), 
                parent
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
            context.setOptimizelyGraphClient(globalClient)
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
                siteId: channel ? (globalClient.currentOptiCmsSchema == OptiCmsSchema.CMS12 ? channel.id : getPrimaryURL(channel).href) : null
            }
            if (isDebug())
                console.log(`⚪ [CmsPage] Processed Next.JS route: ${ JSON.stringify(props) } => getContentByPath Variables: ${ JSON.stringify(requestVars)}`)

            const response = await getContentByPath(globalClient, requestVars)
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
    
    const fullPath = '/'+slugs.filter(x => x && x.length > 0).map(x => decodeURIComponent(x)).join('/')
    if (!slugs[slugs.length - 1].includes('.'))
        return fullPath + '/'
    return fullPath
}

function getPrimaryURL(chnl: ChannelDefinition) : URL
{
    const dd = chnl.domains.filter(x => x.isPrimary).at(0) ?? chnl.domains.at(0)
    if (!dd)
        return chnl.getPrimaryDomain()
    const s = dd.name.startsWith('localhost') || dd.name.indexOf('.local') > 0 ? 'http:' : 'https:'
    return new URL(`${s}//${dd.name}`)
}