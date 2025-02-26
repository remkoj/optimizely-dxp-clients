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
import { CmsContent, Utils, getServerContext, type ComponentFactory } from '@remkoj/optimizely-cms-react/rsc'

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

    /**
     * Takes the Next.JS route segments and try to transform it into an initial
     * locale code, the default implementation will try to resolve the `lang`
     * route segment using the channel definition.
     * 
     * @param       slugs       The slugs to resolve
     * @returns     The resolved locale
     */
    paramsToLocale: (params?: TParams, channel?: ChannelDefinition) => string | undefined
}

const CreatePageOptionDefaults : CreatePageOptions<string> = {
    getContentByPath: getContentByPathBase,
    client: getServerClient,
    routerFactory: (client) => new RouteResolver(client),
    propsToCmsPath: ({ params }) => buildRequestPath(params),
    routeToParams: (route) => { return { path: urlToPath(route.url), lang: route.locale }},
    paramsToLocale: (params, channel) => 
    {
        if (!channel)
            return undefined
        const lang = (params as Record<string,string|string[]|undefined>)?.lang
        const toTest = Array.isArray(lang) ? lang.at(0) : lang
        if (!toTest)
            return channel.defaultLocale
        return channel.slugToLocale(toTest.toString())
    }
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
    const { getContentByPath, client: clientFactory, channel, propsToCmsPath, routeToParams, routerFactory, paramsToLocale } = { 
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

    // Create channelId
    /**
     * The Channel Identifier to be used for this page
     */
    const channelId = channel ? globalClient.currentOptiCmsSchema == OptiCmsSchema.CMS12 ? channel.id : getPrimaryURL(channel).origin : undefined;

    const pageDefintion : OptiCmsNextJsPage<TParams, TSearchParams> = {
        generateStaticParams : async () => (await router.getRoutes(channelId)).map(r => routeToParams(r)),
        generateMetadata: async ( { params, searchParams }, parent ) =>
        {
            // Get context
            const context = getServerContext()
            context.setOptimizelyGraphClient(globalClient)
            context.setComponentFactory(factory)

            // Read variables from request   
            const requestPath = propsToCmsPath({ params, searchParams })
            if (!requestPath) return Promise.resolve({})
            const initialLocale = paramsToLocale(params, channel)
            if (initialLocale) context.setLocale(initialLocale)
            
            // Debug output
            if (context.isDebug)
                console.log(`⚪ [CmsPage.generateMetadata] Processed Next.JS route: ${ JSON.stringify(params) } => Optimizely CMS route: ${ JSON.stringify({ path: requestPath, siteId: channelId })}`)

            // Resolve the route to a content link
            const routeInfo = await getInfoByPath(requestPath, channelId)
            if (!routeInfo) {
                if (context.isDebug)
                    console.log('⚪ [CmsPage.generateMetadata] No data received')
                return Promise.resolve({})
            }
            const [ route, contentLink, contentType, graphLocale ] = routeInfo
            if (context.isDebug)
                console.log(`⚪ [CmsPage.generateMetadata] Retrieved content info:`, route)

            // Update context from route
            context.setLocale(route.locale)

            // Fetch the metadata based upon the actual content type and resolve parent
            const metaResolver = new MetaDataResolver(globalClient)
            const [pageMetadata, baseMetadata] = await Promise.all([
                metaResolver.resolve(factory, contentLink, contentType, graphLocale), 
                parent
            ])
            
            if (context.isDebug)
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
        CmsPage: async ({ params, searchParams }) =>
        {
            // Prepare the context
            const context = getServerContext()
            context.setOptimizelyGraphClient(globalClient)
            context.setComponentFactory(factory)

            // Analyze the Next.JS Request props
            const requestPath = propsToCmsPath({ params, searchParams })
            if (context.isDebug)
                console.log(`⚪ [CmsPage] Processed Next.JS route: ${ JSON.stringify( params) } => Optimizely CMS route: ${ JSON.stringify({ path: requestPath })}`)

            // If we don't have the path, or the path is an internal Next.js route reject it.
            if (!requestPath || requestPath.startsWith('/_next/'))
                return notFound()

            // Determine the initial locale
            const initialLocale = paramsToLocale(params, channel)
            if (initialLocale) context.setLocale(initialLocale)

            // Resolve the content based upon the path
            const pathForRequest = (requestPath.endsWith("/") ? [ requestPath.substring(0, requestPath.length - 1), requestPath ] : [ requestPath, requestPath + '/' ]).filter(x => x.length >= 1)
            const requestVars = {
                path: pathForRequest,
                siteId: channelId
            }
            if (context.isDebug)
                console.log(`⚪ [CmsPage] Processed Next.JS route: ${ JSON.stringify( params) } => getContentByPath Variables: ${ JSON.stringify(requestVars)}`)

            const response = await getContentByPath(globalClient, requestVars)
            const info = (response?.content?.items ?? [])[0]

            if (!info) {
                if (context.isDebugOrDevelopment) {
                    console.error(`🔴 [CmsPage] Unable to load content for ${ requestPath }, data received: `, response)
                }
                return notFound()
            } else if (context.isDebugOrDevelopment && (response?.content?.items ?? []).length > 1) {
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