import 'server-only'
import type { Metadata, ResolvingMetadata } from 'next'
import deepmerge from 'deepmerge'
import { notFound } from 'next/navigation.js'
import { type JSX } from 'react'

// GraphQL Client & Services
import { type ContentLinkWithLocale } from '@remkoj/optimizely-graph-client'
import {
  RouteResolver,
  type IRouteResolver,
  type Route,
} from '@remkoj/optimizely-graph-client/router'
import { type ChannelDefinition } from '@remkoj/optimizely-graph-client/channels'
import {
  type IOptiGraphClient,
  OptiCmsSchema,
} from '@remkoj/optimizely-graph-client/client'
import { normalizeContentLinkWithLocale } from '@remkoj/optimizely-graph-client/utils'

// React Support
import {
  CmsContent,
  Utils,
  ServerContext,
  updateSharedServerContext,
  type GenericContext,
  type ComponentFactory,
} from '@remkoj/optimizely-cms-react/rsc'

// Within package
import { MetaDataResolver } from '../metadata.js'
import { urlToPath, localeToGraphLocale } from './utils.js'
import {
  type GetContentByPathMethod,
  type GetContentByPathVariables,
} from './data.js'
import { createClient } from '../client.js'

export type DefaultCmsPageParams = {
  path?: string[]
}
export type DefaultCmsPageSearchParams = {}

export type DefaultCmsPageProps<
  TParams extends Record<
    string,
    string | Array<string> | undefined
  > = DefaultCmsPageParams,
  TSearchParams extends Record<
    string,
    string | Array<string> | undefined
  > = DefaultCmsPageSearchParams,
> = {
  params: Promise<TParams>
  searchParams: Promise<TSearchParams>
}

export type OptiCmsNextJsPage<
  TParams extends Record<
    string,
    string | Array<string> | undefined
  > = DefaultCmsPageParams,
  TSearchParams extends Record<
    string,
    string | Array<string> | undefined
  > = DefaultCmsPageSearchParams,
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
  generateMetadata: (
    props: DefaultCmsPageProps<TParams, TSearchParams>,
    resolving: ResolvingMetadata
  ) => Promise<Metadata>

  /**
   * The actual component that performs the page rendering
   *
   * @param       props           The properties of the page
   * @returns     The component to render the page
   */
  CmsPage: (
    props: DefaultCmsPageProps<TParams, TSearchParams>
  ) => Promise<JSX.Element>
}

export enum SystemLocales {
  All = 'ALL',
  Neutral = 'NEUTRAL',
}

export type CreatePageOptions<
  LocaleEnum = SystemLocales,
  TParams extends Record<
    string,
    string | Array<string> | undefined
  > = DefaultCmsPageParams,
  TSearchParams extends Record<
    string,
    string | Array<string> | undefined
  > = DefaultCmsPageSearchParams,
> = {
  /**
   * Main function used to retrieve the content by path
   */
  getContentByPath?: GetContentByPathMethod<LocaleEnum>

  /**
   * The factory that should yield the GraphQL Client to be used within this
   * page.
   *
   * @param token   The token retrieved by the CMS Page from the context, always undefined
   * @param scope   The scope in which the client is being created, this allows for checking draftMode in configuring the client
   * @returns       The client instance
   */
  client: (
    token?: string,
    scope?: 'request' | 'metadata'
  ) => IOptiGraphClient | Promise<IOptiGraphClient>

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
  propsToCmsPath: (
    props: DefaultCmsPageProps<TParams, TSearchParams>
  ) => Promise<string | null>

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
  paramsToLocale: (
    params?: Promise<TParams | undefined>,
    channel?: ChannelDefinition
  ) => Promise<string | undefined>
}

const CreatePageOptionDefaults: CreatePageOptions<string> = {
  client: createClient,
  routerFactory: (client) => new RouteResolver(client),
  propsToCmsPath: async ({ params }) => buildRequestPath(await params),
  routeToParams: (route) => {
    return { path: urlToPath(route.url), lang: route.locale }
  },
  paramsToLocale: async (params, channel) => {
    if (!channel) return undefined
    const lang = (
      (await params) as Record<string, string | string[] | undefined>
    )?.lang
    const toTest = Array.isArray(lang) ? lang.at(0) : lang
    if (!toTest) return channel.defaultLocale
    return channel.slugToLocale(toTest.toString())
  },
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
  TParams extends Record<
    string,
    string | Array<string> | undefined
  > = DefaultCmsPageParams,
  TSearchParams extends Record<
    string,
    string | Array<string> | undefined
  > = DefaultCmsPageSearchParams,
>(
  factory: ComponentFactory,
  options?: Partial<CreatePageOptions<LocaleEnum, TParams, TSearchParams>>
): OptiCmsNextJsPage<TParams, TSearchParams> {
  // Build the global/shared configuration for the Optimizely CMS Page
  const {
    getContentByPath,
    client: clientFactory,
    channel,
    propsToCmsPath,
    routeToParams,
    routerFactory,
    paramsToLocale,
  } = {
    ...CreatePageOptionDefaults,
    ...options,
  } as CreatePageOptions<LocaleEnum, TParams, TSearchParams>

  async function buildContext(
    initialLocale: string = 'en'
  ): Promise<ContextWith<ServerContext, 'client' | 'locale'>> {
    return new ServerContext({
      factory,
      client: await clientFactory(undefined, 'request'),
      mode: 'public',
      locale: initialLocale,
    }) as ContextWith<ServerContext, 'client' | 'locale'>
  }

  const pageDefintion: OptiCmsNextJsPage<TParams, TSearchParams> = {
    generateStaticParams: async () => {
      const client = await clientFactory(undefined, 'metadata')
      const router = routerFactory(client)
      const channelId = getChannelId(client, channel)
      const allRoutes = await router.getRoutes(
        channelId,
        channel ? undefined : true
      )
      return allRoutes.map((r) => routeToParams(r))
    },

    generateMetadata: async ({ params, searchParams }, parent) => {
      // Get context
      const context = await buildContext()
      const channelId = getChannelId(context.client, channel)

      // Read variables from request
      const [requestPath, initialLocale] = await Promise.all([
        propsToCmsPath({ params, searchParams }),
        paramsToLocale(params, channel),
      ])
      if (!requestPath) return Promise.resolve({})
      if (initialLocale) context.setLocale(initialLocale)

      const awaitedParams = await params

      // Debug output
      if (context.isDebug)
        console.log(
          `⚪ [CmsPage.generateMetadata] Processed Next.JS route: ${JSON.stringify(awaitedParams)} => Optimizely CMS route: ${JSON.stringify({ path: requestPath, siteId: channelId })}`
        )

      // Resolve the route to a content link
      const routeInfo = await getInfoByPath(
        context.client,
        routerFactory,
        requestPath,
        channel
      )
      if (!routeInfo || !routeInfo[0]) {
        if (context.isDebug)
          console.log('⚪ [CmsPage.generateMetadata] No data received')
        return Promise.resolve({})
      }
      const [route, contentLink, contentType, graphLocale] = routeInfo
      if (context.isDebug)
        console.log(
          `⚪ [CmsPage.generateMetadata] Retrieved content info:`,
          route
        )

      // Update context from route
      context.setLocale(route.locale)

      // Make the shared server context available
      updateSharedServerContext(context)

      // Fetch the metadata based upon the actual content type and resolve parent
      const metaResolver = new MetaDataResolver(context.client)
      const [pageMetadata, baseMetadata] = await Promise.all([
        metaResolver.resolve(factory, contentLink, contentType, graphLocale),
        parent,
      ])

      if (context.isDebug)
        console.log(
          `⚪ [CmsPage.generateMetadata] Component yielded metadata:`,
          pageMetadata
        )

      // Make sure merging of objects goes correctly
      for (const metaKey of Object.getOwnPropertyNames(
        pageMetadata
      ) as (keyof Metadata)[]) {
        if (
          isObject(pageMetadata[metaKey]) &&
          isObject(baseMetadata[metaKey])
        ) {
          //@ts-expect-error Silence error due to failed introspection...
          pageMetadata[metaKey] = deepmerge<object>(
            baseMetadata[metaKey],
            pageMetadata[metaKey],
            { arrayMerge: (target, source) => [...source] }
          )
        }
      }

      // Not sure, but needed somehow...
      if (
        typeof baseMetadata.metadataBase == 'string' &&
        (baseMetadata.metadataBase as string).length > 1
      ) {
        pageMetadata.metadataBase = new URL(baseMetadata.metadataBase)
      }
      return pageMetadata
    },

    CmsPage: async ({ params, searchParams }) => {
      // Prepare the context
      const context = await buildContext()
      //const params = await asyncParams;

      // Analyze the Next.JS Request props
      const [requestPath, initialLocale] = await Promise.all([
        propsToCmsPath({ params, searchParams }),
        paramsToLocale(params, channel),
      ])
      const awaitedParams = await params
      if (context.isDebug)
        console.log(
          `⚪ [CmsPage] Processed Next.JS route: ${JSON.stringify(awaitedParams)} => Optimizely CMS route: ${JSON.stringify({ path: requestPath })}`
        )

      // If we don't have the path, or the path is an internal Next.js route reject it.
      if (!requestPath || requestPath.startsWith('/_next/')) return notFound()

      // Determine the initial locale
      if (initialLocale) context.setLocale(initialLocale)

      // Resolve the content based upon the path
      const lookupData = await (getContentByPath
        ? loadContentByPath(
            context.client,
            getContentByPath,
            requestPath,
            channel
          )
        : getInfoByPath(context.client, routerFactory, requestPath, channel))
      if (!lookupData) {
        console.error(
          `🔴 [CmsPage] Unable to resolve the content for ${JSON.stringify(params)}!`
        )
        return notFound()
      }
      const [route, contentLink, contentType, graphLocale, contentData] =
        lookupData

      if (contentLink?.locale) context.setLocale(contentLink.locale as string)

      // Make the shared server context available
      updateSharedServerContext(context)

      // Render the content link
      return (
        <CmsContent
          contentType={contentType}
          contentLink={contentLink}
          fragmentData={contentData ?? undefined}
          ctx={context}
        />
      )
    },
  }

  return pageDefintion
}

type ContextWith<C extends GenericContext, T extends keyof C> = Omit<C, T> & {
  [P in T]: NonNullable<C[P]>
}

type LookupResponse = [
  Route | null,
  ContentLinkWithLocale,
  string[],
  string,
  Record<string, any> | null,
]

// Helper function to obtain the info by path
async function getInfoByPath(
  client: IOptiGraphClient,
  routerFactory: (client?: IOptiGraphClient) => IRouteResolver,
  requestPath: string,
  channel?: ChannelDefinition
) {
  if (client.debug)
    console.log(
      `⚪ [CmsPage.getInfoByPath] Loading content for path "${requestPath}" using RouteResolver`
    )
  const channelId = getChannelId(client, channel)
  const router = routerFactory(client)
  const route = await router.getContentInfoByPath(requestPath, channelId)
  if (!route) {
    if (client.debug)
      console.warn(
        `🟠 [CmsPage.getInfoByPath] The RouteResolver was unable to resolve the route information for "${requestPath}"`
      )
    return undefined
  }
  const contentLink = router.routeToContentLink(route)
  const contentType = route.contentType
  const graphLocale = localeToGraphLocale(route.locale, channel)
  return [route, contentLink, contentType, graphLocale, null] as LookupResponse
}

async function loadContentByPath<LocaleEnum = SystemLocales>(
  client: IOptiGraphClient,
  getContentByPath: GetContentByPathMethod<LocaleEnum>,
  requestPath: string,
  channel?: ChannelDefinition,
  isDebug: boolean = false
) {
  if (client.debug)
    console.log(
      `⚪ [CmsPage.loadContentByPath] Loading content for path "${requestPath}" using getContentByPath method`
    )
  const channelId = getChannelId(client, channel)
  const pathForRequest = [
    requestPath,
    requestPath.endsWith('/')
      ? requestPath.substring(0, requestPath.length - 1)
      : requestPath + '/',
  ].filter((x) => x)

  const requestVars: GetContentByPathVariables<LocaleEnum> = {
    path: pathForRequest,
    siteId: channelId,
  }
  if (client?.isPreviewEnabled()) requestVars.changeset = client?.getChangeset()
  if (isDebug)
    console.log(
      `⚪ [CmsPage.loadContentByPath] Processed Next.JS route => getContentByPath Variables: ${JSON.stringify(requestVars)}`
    )

  const response = await getContentByPath(client, requestVars)
  const info = Array.isArray(response?.content?.items)
    ? response?.content?.items[0]
    : response?.content?.items

  if (!info) {
    if (isDebug) {
      console.error(
        `🔴 [CmsPage.loadContentByPath] Unable to load content for ${requestPath}, data received: `,
        response
      )
    }
    return notFound()
  } else if (isDebug && (response?.content?.total ?? 0) > 1) {
    console.warn(
      `🟠 [CmsPage.loadContentByPath] Resolving content for ${requestPath}, yielded ${response?.content?.total ?? 0} items, picked:`,
      info
    )
  }

  // Extract the type & link
  const contentType = Utils.normalizeContentType(info._metadata?.types)
  const contentLink = normalizeContentLinkWithLocale(info._metadata)
  if (!contentLink) {
    console.error(
      '🔴 [CmsPage.loadContentByPath] Unable to infer the contentLink from the retrieved content, this should not have happened!'
    )
    return notFound()
  }
  const graphLocale = localeToGraphLocale(info._metadata?.locale, channel)

  return [null, contentLink, contentType, graphLocale, info] as LookupResponse
}

function getChannelId(client: IOptiGraphClient, channel?: ChannelDefinition) {
  return channel
    ? client.currentOptiCmsSchema == OptiCmsSchema.CMS12
      ? channel.id
      : getPrimaryURL(channel).origin
    : undefined
}

/**
 *
 *
 * @param   param0  The URL parameters
 * @returns The request path as understood by Graph
 */
function buildRequestPath({
  lang,
  path,
}: {
  lang?: string | null
  path?: (string | null)[] | null
}): string {
  const slugs: string[] = []
  if (path) slugs.push(...(path.filter((x) => x) as string[]))
  if (lang) slugs.unshift(lang)
  if (slugs.length == 0) return '/'

  const fullPath =
    '/' +
    slugs
      .filter((x) => x && x.length > 0)
      .map((x) => decodeURIComponent(x))
      .join('/')
  if (!slugs[slugs.length - 1].includes('.')) return fullPath + '/'
  return fullPath
}

function getPrimaryURL(chnl: ChannelDefinition): URL {
  const dd = chnl.domains.filter((x) => x.isPrimary).at(0) ?? chnl.domains.at(0)
  if (!dd) return chnl.getPrimaryDomain()
  const s =
    dd.name.startsWith('localhost') || dd.name.indexOf('.local') > 0
      ? 'http:'
      : 'https:'
  return new URL(`${s}//${dd.name}`)
}

function isObject(toTest: any): toTest is object {
  return typeof toTest == 'object' && toTest != null && toTest != undefined
}
