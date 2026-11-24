import 'server-only'
import { notFound } from 'next/navigation.js'
import { cache } from 'react'

// GraphQL Client & Services
import { ifChannelDefinition } from '@remkoj/optimizely-graph-client/channels';

// React Support
import {
  CmsContent,
  ServerContext,
  type GenericContext,
  type ComponentFactory,
} from '@remkoj/optimizely-cms-react/rsc'

// Within package
import { MetaDataResolver } from '../metadata.js'

// Within CMS-Page
import type { DefaultCmsPageParams, DefaultCmsPageSearchParams, OptiCmsNextJsPage } from './_types.js';
import { getChannelId, getRequestDiagnostics } from './_base.js'
import { loadContentByPath as loadContentByPathBase } from './_loadContentByPath.js'
import { getInfoByPath as getInfoByPathBase } from './_getInfoByPath.js'
import { SystemLocales } from './_base.js';
import { CreatePageOptions, withPageDefaults as withDefaults } from './_options.js';
import { resolveClient } from '../client.js';

// Prepare cached versions of the content and info loaders
const getInfoByPath = cache(getInfoByPathBase)
const loadContentByPath = cache(loadContentByPathBase)

// Export from internal modules for external usage
export { SystemLocales } from './_base.js';
export type { DefaultCmsPageParams, DefaultCmsPageProps, DefaultCmsPageSearchParams, OptiCmsNextJsPage } from './_types.js';
export type { CreatePageOptions } from './_options.js';

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
  } = withDefaults(options);

  // Helper function to build the server context for the page
  async function buildContext(
    initialLocale: string = 'en'
  ): Promise<ContextWith<ServerContext, 'client' | 'locale'>> {
    return new ServerContext({
      factory,
      client: await resolveClient(clientFactory, undefined, 'request'),
      mode: 'public',
      locale: initialLocale,
    }) as ContextWith<ServerContext, 'client' | 'locale'>
  }

  // Define the Optimizely CMS Page structure and behavior
  const pageDefintion: OptiCmsNextJsPage<TParams, TSearchParams> = {
    generateStaticParams: async () => {
      const client = await resolveClient(clientFactory, undefined, 'metadata')
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
      const [pageMetadata,] = await Promise.all([
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
          `🔴 [CmsPage] Unable to resolve the content for ${JSON.stringify(await params)}!${getRequestDiagnostics(context.client)}`
        )
        return notFound()
      }
      const [, contentLink, contentType,, contentData] = lookupData

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
