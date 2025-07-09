import 'server-only'
import type { Metadata, ResolvingMetadata } from 'next'
import deepmerge from 'deepmerge'
import { notFound } from 'next/navigation.js'
import { type JSX } from 'react'

// GraphQL Client & Services
import {
  RouteResolver,
  type IRouteResolver,
  type Route,
} from '@remkoj/optimizely-graph-client/router'
import {
  type ChannelDefinition,
  ifChannelDefinition,
} from '@remkoj/optimizely-graph-client/channels'
import { type IOptiGraphClient } from '@remkoj/optimizely-graph-client/client'

// React Support
import {
  CmsContent,
  ServerContext,
  updateSharedServerContext,
  type GenericContext,
  type ComponentFactory,
} from '@remkoj/optimizely-cms-react/rsc'

// Within package
import { MetaDataResolver } from '../metadata.js'
import { urlToPath } from './utils.js'
import { type GetContentByPathMethod } from './data.js'
import { createClient } from '../client.js'
import { getChannelId } from './_base.js'
import { loadContentByPath } from './_loadContentByPath.js'
import { getInfoByPath } from './_getInfoByPath.js'

// Within CmsPage
import { SystemLocales } from './_base.js'
export { SystemLocales } from './_base.js'

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
   * @param scope   The scope in which the client is being created, this allows for checking
   *                draftMode in configuring the client
   * @returns       The client instance
   */
  client: (
    token?: string,
    scope?: 'request' | 'metadata'
  ) => IOptiGraphClient | Promise<IOptiGraphClient>

  /**
   * The channel information used to resolve locales, domains and more.
   *
   * If provided with a string value, this is assumed to be the Application/Website identifier
   * for the deployment (Base URL ***without trailing slash*** for SaaS CMS; Website GUID for
   * CMS 12).
   */
  channel?: ChannelDefinition | string

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
    // If there's no channel, just return undefined
    if (!channel) return undefined

    // Check if we have a language, and if so, resolve based upon that language
    const lang = (
      (await params) as Record<string, string | string[] | undefined>
    )?.lang
    const toTest = Array.isArray(lang) ? lang.at(0) : lang
    if (toTest)
      return channel.slugToLocale(toTest.toString()) ?? channel.defaultLocale

    // Check if we have a path, and if so, resolve based upon the first slug in the path
    const path = (
      (await params) as Record<string, string | string[] | undefined>
    )?.path
    const firstSlug = Array.isArray(path) ? path.at(0) : path
    if (firstSlug)
      return channel.slugToLocale(firstSlug) ?? channel.defaultLocale

    // We have neither a language, nor a slug, return the default
    return channel.defaultLocale
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
        paramsToLocale(params, ifChannelDefinition(channel)),
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
        paramsToLocale(params, ifChannelDefinition(channel)),
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
            channel,
            initialLocale as LocaleEnum | undefined
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

function isObject(toTest: any): toTest is object {
  return typeof toTest == 'object' && toTest != null && toTest != undefined
}
