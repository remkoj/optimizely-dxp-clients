import 'server-only'
import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation.js'
import { type JSX, cache } from 'react'

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
  isNonEmptyString,
  type GenericContext,
  type ComponentFactory,
} from '@remkoj/optimizely-cms-react/rsc'

// Within package
import { MetaDataResolver } from '../metadata.js'
import { urlToPath } from './utils.js'
import { type GetContentByPathMethod } from './data.js'
import { createClient } from '../client.js'
import { getChannelId, LookupResponse } from './_base.js'
import { loadContentByPath as loadContentByPathBase } from './_loadContentByPath.js'
import { getInfoByPath as getInfoByPathBase } from './_getInfoByPath.js'

const getInfoByPath = cache(getInfoByPathBase)
const loadContentByPath = cache(loadContentByPathBase)

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
  ) => Promise<Metadata> | Metadata

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
  client:
    ((token?: string, scope?: 'request' | 'metadata') => IOptiGraphClient) |
    ((token?: string, scope?: 'request' | 'metadata') => Promise<IOptiGraphClient>)

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
    props: DefaultCmsPageProps<TParams, TSearchParams>,
    channel?: ChannelDefinition
  ) => Promise<string | null>

  /**
   * Take the props received by the CmsPage from Next.JS and tranform those
   * into a the page variant used by the CMS.
   *
   * @param       props       The Properties (slugs & search params) received
   *                          by Next.JS
   * @return      The path to be retrieved from Router or getContentByPath
   *              function
   */
  propsToVariant: (
    props: DefaultCmsPageProps<TParams, TSearchParams>,
    channel?: ChannelDefinition
  ) => Promise<string | null | undefined>

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

type SupportedPageParams = {
  path?: string[]
  lang?: string
}

const CreatePageOptionDefaults: CreatePageOptions<string> = {
  client: createClient,
  routerFactory: (client) => new RouteResolver(client),
  async propsToCmsPath(props) {
    const params : SupportedPageParams = await props.params; // Read the parameters
    const slugs = [ params.lang, ...(params.path ?? [])] // Build the full set of slugs for the path
      .filter(isNonEmptyString) // Remove empty values
      .filter((x) => !x.startsWith(encodeURIComponent('var:'))) // Remove any variant specification
      .map((x) => decodeURIComponent(x)); // Decode the URI components

    if (slugs.length === 0) return '/'; // We're requesting the homepage, so just return that path

    // Build the URL
    const fullPath = !slugs[slugs.length - 1].includes('.') ? '/' + slugs.join('/') + '/' : '/' + slugs.join('/');
    return fullPath;
  },

  async propsToVariant({ params }) {
    const pathSegments = (await params).path
    const variantPrefix = encodeURIComponent('var:');
    const variantSegment = Array.isArray(pathSegments) ? pathSegments.filter(x => typeof x === 'string' && x.startsWith(variantPrefix)).at(0) : undefined
    return variantSegment ? variantSegment.substring(variantPrefix.length) : undefined
  },

  routeToParams(route) {
    const pathSegments = urlToPath(route.url)
    if (route.variation)
      pathSegments.push(`var:${ route.variation }`)
    return { path: pathSegments, lang: route.locale }
  },

  async paramsToLocale(params, channel) {
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
    propsToVariant,
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
        channel ? undefined : true,
        true
      )
      return allRoutes.map((r) => routeToParams(r))
    },

    generateMetadata: async ({ params, searchParams }, resolvingMetadata) => {
      // Prepare the context
      const context = await buildContext()

      // Analyze the Next.JS Request props
      const [requestPath, initialLocale, variation] = await Promise.all([
        propsToCmsPath({ params, searchParams }, ifChannelDefinition(channel)),
        paramsToLocale(params, ifChannelDefinition(channel)),
        propsToVariant({ params, searchParams }, ifChannelDefinition(channel)).then(variant => variant || undefined)
      ])

      // Valdiate path
      if (!requestPath) return {}

      // Track initial locale
      if (initialLocale) context.setLocale(initialLocale)
      
      // Resolve route
      const pathInfo = await getInfoByPath(context.client, routerFactory, requestPath, channel, variation);
      if (!pathInfo)
        return {};
      const [ route, contentLink, contentType, graphLocale ] = pathInfo
      if (!contentLink || !contentType)
        return {}

      // Update context from route
      if (route)
        context.setLocale(route.locale)

      // Fetch the metadata based upon the actual content type and resolve parent
      const metaResolver = new MetaDataResolver(context.client)
      const [pageMetadata, baseMetadata] = await Promise.all([
        metaResolver.resolve(factory, contentLink, contentType, graphLocale),
        resolvingMetadata,
      ])
      
      return pageMetadata
    },

    CmsPage: async ({ params, searchParams }) => {
      // Prepare the context
      const context = await buildContext()

      // Analyze the Next.JS Request props
      const [requestPath, initialLocale, requestVariant] = await Promise.all([
        propsToCmsPath({ params, searchParams }, ifChannelDefinition(channel)),
        paramsToLocale(params, ifChannelDefinition(channel)),
        (await propsToVariant({ params, searchParams })) ?? undefined
      ])

      if (context.isDebug)
        console.log(
          `⚪ [CmsPage] Processed Next.JS route: ${JSON.stringify(await params)} => Optimizely CMS route: ${JSON.stringify({ path: requestPath, variant: requestVariant })}`
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
          initialLocale as LocaleEnum | undefined,
          requestVariant
        )
        : getInfoByPath(context.client, routerFactory, requestPath, channel, requestVariant))
      if (!lookupData) {
        console.error(
          `🔴 [CmsPage] Unable to resolve the content for ${JSON.stringify(await params)}!`
        )
        return notFound()
      }
      const [route, contentLink, contentType, graphLocale, contentData] =
        lookupData

      if (contentLink?.locale) context.setLocale(contentLink.locale as string)

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
