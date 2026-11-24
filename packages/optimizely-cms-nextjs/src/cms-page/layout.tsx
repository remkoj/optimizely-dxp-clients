import type { PropsWithChildren, ReactNode, JSX } from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import type { SystemLocales } from './_base.js'
import type { DefaultCmsPageProps, DefaultCmsPageParams, DefaultCmsPageSearchParams } from './_types.js'
import { type CreateLayoutOptions, withLayoutDefaults as withDefaults } from './_options.js';
import { GetContentByPathVariables } from './data.js'
import { getChannelId } from './_base.js'
import { resolveClient } from '../client.js'
import { Utils, isDebug } from '@remkoj/optimizely-cms-react/rsc'

// GraphQL Client & Services
import { ifChannelDefinition } from '@remkoj/optimizely-graph-client/channels'

export type CmsPageLayout<
  TParams extends Record<string, string | Array<string> | undefined> = DefaultCmsPageParams
> = {
  generateMetadata: ((
    props: Omit<DefaultCmsPageProps<TParams>, 'searchParams'>,
    resolving: ResolvingMetadata
  ) => Promise<Metadata>) | ((
    props: Omit<DefaultCmsPageProps<TParams>, 'searchParams'>,
    resolving: ResolvingMetadata
  ) => Metadata)
  PageLayout: (
    props: PropsWithChildren<Omit<DefaultCmsPageProps<TParams>, 'searchParams'>>
  ) => JSX.Element | ReactNode
}

export type { CreateLayoutOptions } from './_options.js';

export function createLayout<
  LocaleEnum = SystemLocales,
  TParams extends Record<string, string | Array<string> | undefined> = DefaultCmsPageParams
>(
  options?: Partial<CreateLayoutOptions<LocaleEnum, TParams>>
): CmsPageLayout<TParams> {
  // Extract the configuration options with defaults applied
  const {
    channel: channelInput,
    client: clientFactory,
    getMetaDataByPath,
    paramsToLocale,
    propsToCmsPath,
    propsToVariant,
    toValidatedLocale
  }: CreateLayoutOptions<LocaleEnum, TParams> = withDefaults(options);

  // Initialize the search parameters with a default empty object
  const searchParams = Promise.resolve({} as DefaultCmsPageSearchParams);
  // Initialize the channel definition based on the provided input
  const channel = ifChannelDefinition(channelInput);

  // Define the page layout structure
  const pageLayoutDefinition: CmsPageLayout<TParams> = {
    /**
     * Make sure that there's a sane default for the title, canonical URL
     * and the language alternatives
     *
     * @param       props   The layout properties
     * @returns     The metadata that must be merged into the defaults
     */
    generateMetadata: async ({ params }, resolving) => {
      if (!getMetaDataByPath) {
        if (isDebug())
          console.warn(`🟡 [CmsPageLayout] No generic metadata function provided`)
        return {}
      }

      // Prepare the necessary data for metadata generation: client, request path, locale, and variant
      // using parallel processing.
      const [client, requestPath, locale, variant] = await Promise.all([
        resolveClient(clientFactory, undefined, 'metadata'),
        propsToCmsPath({ params, searchParams }, channel),
        paramsToLocale(params, channel),
        propsToVariant({ params, searchParams }, channel).then(variant => variant || undefined)
      ]);

      // Determine if the client is in debug or development mode
      const isDebugOrDevelopment = client.isDebugOrDevelopment();
      
      // Stop processing if no request path could be determined
      if (!requestPath) {
        if (isDebugOrDevelopment)
          console.warn(`🟡 [CmsPageLayout] No request path could be determined`)
        return {}
      }

      // Log the request path for debugging purposes if in debug or development mode
      if (isDebugOrDevelopment)
        console.log(`🟢 [CmsPageLayout] Generating metadata for: ${requestPath}`)

      // Load the metadata for the given request path, locale, channel and variant
      const variables: GetContentByPathVariables<LocaleEnum> = {
        path: requestPath,
        locale: await toValidatedLocale(locale, channel, client),
        siteId: getChannelId(client, channelInput),
        variation: variant && variant.length > 0
          ? { include: 'SOME', value: [variant] }
          : undefined,
      }
      const response = await getMetaDataByPath(client, variables).catch((e) => {
        console.error(`[CmsPageLayout] Metadata error:`, e)
        return undefined
      });

      // Extract the first metadata item from the response, if available
      const metadata = (response?.getGenericMetaData?.items ?? [])[0]
      if (!metadata) {
        if (isDebugOrDevelopment)
          console.log(`🟡 [CmsPageLayout] Unable to locate metadata for: ${requestPath}`)
        return {}
      };

      const base = await resolving
      const title = base?.title?.template
        ? {
          template: base?.title?.template,
          default: metadata.name as string,
        }
        : (metadata.name as string)
      const pageMetadata: Metadata = {
        title,
        alternates: {
          canonical: metadata.canonical as string,
          languages: {},
        },
        openGraph: {
          ...base.openGraph,
          title,
          url: metadata.canonical as string,
          alternateLocale: [],
        },
      }

      // Add alternative URLs
      const alternates = (metadata?.alternatives || []).filter(
        Utils.isNotNullOrUndefined
      ) as { locale: string; href: string }[]
      alternates.forEach((alt) => {
        if (
          pageMetadata.openGraph &&
          Array.isArray(pageMetadata.openGraph.alternateLocale)
        ) {
          pageMetadata.openGraph.alternateLocale.push(alt.locale)
        }
        if (pageMetadata.alternates && pageMetadata.alternates.languages) {
          //@ts-expect-error We need the locale to be dynamic, based upon the locales provided by the CMS
          pageMetadata.alternates.languages[alt.locale] = alt.href
        }
      })

      return pageMetadata
    },

    PageLayout: ({ children }) => children,
  }
  return pageLayoutDefinition
}

export default createLayout
