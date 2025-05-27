import { type PropsWithChildren, type ReactNode, type JSX } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import type {
  ChannelDefinition,
  ClientFactory,
} from '@remkoj/optimizely-graph-client'
import type { DefaultCmsPageProps } from './page.js'
import {
  getMetaDataByPath as getMetaDataByPathBase,
  type GetMetaDataByPathMethod,
} from './data.js'
import { getServerClient } from '../client.js'
import { Utils, isDebug } from '@remkoj/optimizely-cms-react/rsc'

export type CmsPageLayout = {
  generateMetadata: (
    props: Omit<DefaultCmsPageProps, 'searchParams'>,
    resolving: ResolvingMetadata
  ) => Promise<Metadata>
  PageLayout: (
    props: PropsWithChildren<Omit<DefaultCmsPageProps, 'searchParams'>>
  ) => JSX.Element | ReactNode
}

export type CreateLayoutOptions = {
  defaultLocale: string | null
  getMetaDataByPath: GetMetaDataByPathMethod
  client: ClientFactory
  channel?: ChannelDefinition
}

const defaultCreateLayoutOptions: CreateLayoutOptions = {
  defaultLocale: null,
  getMetaDataByPath: getMetaDataByPathBase,
  client: getServerClient,
}

export function createLayout(
  options?: Partial<CreateLayoutOptions>
): CmsPageLayout {
  const {
    defaultLocale,
    getMetaDataByPath,
    client: clientFactory,
    channel,
  }: CreateLayoutOptions = {
    ...defaultCreateLayoutOptions,
    ...{ defaultLocale: null },
    ...options,
  }

  const pageLayoutDefinition: CmsPageLayout = {
    /**
     * Make sure that there's a sane default for the title, canonical URL
     * and the language alternatives
     *
     * @param       props   The layout properties
     * @returns     The metadata that must be merged into the defaults
     */
    generateMetadata: async ({ params: asyncParams }, resolving) => {
      const params = await asyncParams
      const relativePath = `/${params.path ? '/' + params.path.join('/') : ''}`

      if (isDebug())
        console.log(
          `⚪ [CmsPageLayout] Generating metadata for: ${relativePath}`
        )

      const variables = {
        path: relativePath,
      }
      const client = clientFactory()
      const response = await getMetaDataByPath(client, variables).catch((e) => {
        console.error(`[CmsPageLayout] Metadata error:`, e)
        return undefined
      })
      const metadata = (response?.getGenericMetaData?.items ?? [])[0]
      if (!metadata) {
        if (isDebug())
          console.log(
            `🟡 [CmsPageLayout] Unable to locate metadata for: ${relativePath}`
          )
        return {}
      }

      const base = await resolving
      const title = base?.title?.template
        ? {
            template: base?.title?.template,
            default: metadata.name as string,
          }
        : (metadata.name as string)
      let pageMetadata: Metadata = {
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
