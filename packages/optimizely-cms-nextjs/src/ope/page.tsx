import 'server-only'

import type {
  EditPageProps,
  EditPageComponent,
  EditViewOptions,
} from './types.js'
import {
  contentLinkToString,
  localeToGraphLocale,
} from '@remkoj/optimizely-graph-client/utils'
import { type ContentLinkWithLocale } from '@remkoj/optimizely-graph-client'
import {
  ServerContext,
  Utils,
  CmsContent,
  updateSharedServerContext,
  type ComponentFactory,
} from '@remkoj/optimizely-cms-react/rsc'
import { notFound } from 'next/navigation.js'
import OnPageEdit from '../components/on-page-edit.js'
import { createAuthorizedClient } from '../client.js'
import React, { type JSX } from 'react'
import Script from 'next/script.js'
import { getContentById } from './data.js'
import { getContentRequest, isValidRequest } from './tools.js'

const defaultOptions: EditViewOptions<string> = {
  refreshNotice: () => <></>,
  layout: (props) => <>{props.children}</>,
  loader: getContentById,
  clientFactory: (token?: string) => createAuthorizedClient(token),
  communicationInjectorPath: '/util/javascript/communicationinjector.js',
  contentResolver: getContentRequest,
  requestValidator: isValidRequest,
  refreshTimeout: false,
}

/**
 * Create the EditPage component needed by Next.JS to render the "On Page
 * Editing" variant of the content item selected by the editor.
 *
 * @param   factory     The component factory to be used
 * @param   options     The optional options to use to control the edit page
 * @returns The React Component that can be used by Next.JS to render the page
 */
export function createEditPageComponent<LocaleType = string>(
  factory: ComponentFactory,
  options?: Partial<EditViewOptions<LocaleType>>
): EditPageComponent {
  const {
    layout: PageLayout,
    refreshNotice: RefreshNotice,
    loader: getContentById,
    clientFactory,
    communicationInjectorPath,
    contentResolver: resolveContent,
    requestValidator: validateRequest,
    refreshTimeout,
  } = { ...defaultOptions, ...options } as EditViewOptions<string>

  function isDevelopment(): boolean {
    return process.env.NODE_ENV == 'development'
  }

  async function EditPage({
    params,
    searchParams,
  }: EditPageProps): Promise<JSX.Element> {
    const props = {
      params: await params,
      searchParams: await searchParams,
    }

    // Validate the search parameters
    if (!validateRequest(props, false, isDevelopment())) {
      console.error('🔴 [OnPageEdit] Invalid edit mode request')
      return notFound()
    }

    // Get the requested content item
    const contentRequestInfo = resolveContent(props)
    if (!contentRequestInfo) {
      console.error('🔴 [OnPageEdit] Unable to resolve requested content')
      return notFound()
    }
    const { token, ctx, ...contentRequest } = contentRequestInfo

    // Build context
    const client = await clientFactory(token)
    const context = new ServerContext({
      client,
      factory,
      mode: ctx,
    })

    // Get information from the Request URI
    if (context.isDebug) {
      console.log('⚪ [OnPageEdit] Request context:', ctx)
      console.log('⚪ [OnPageEdit] Request token:', token)
      console.log(
        '⚪ [OnPageEdit] Requested content:',
        JSON.stringify(contentRequest)
      )
    }

    try {
      const contentInfo = await getContentById(client, {
        ...contentRequest,
        locale: localeToGraphLocale(contentRequest.locale),
        changeset: client.getChangeset(),
      })
      if ((contentInfo?.content?.total ?? 0) > 1) {
        console.warn(
          '🟠 [OnPageEdit] Content request ' +
            JSON.stringify(contentRequest) +
            ' yielded more then one item, picking first matching'
        )
      }
      const contentItem =
        (Array.isArray(contentInfo?.content?.items)
          ? contentInfo?.content?.items[0]
          : contentInfo?.content?.items) ?? undefined
      const contentType = Utils.normalizeContentType(
        contentItem?._metadata.types
      )

      // Return a 404 if the content item or type could not be resolved
      if (!contentItem) {
        console.warn(
          `🟠 [OnPageEdit] The content item for ${JSON.stringify(contentRequest)} could not be loaded from Optimizely Graph`
        )
        return notFound()
      }
      if (!contentType) {
        console.warn(
          `🟠 [OnPageEdit] The content item for ${JSON.stringify(contentRequest)} did not contain content type information`
        )
        return notFound()
      }

      const contentLink: ContentLinkWithLocale = {
        key: contentItem._metadata.key,
        locale: contentItem._metadata.locale,
        version: contentItem._metadata.version,
      }

      if (context.isDebug) {
        console.log(
          '⚪ [OnPageEdit] Resolved content:',
          JSON.stringify({
            ...contentLink,
            type: (contentItem.contentType ?? []).join('/'),
          })
        )
      }

      // Store the editable content so it can be tested
      context.setEditableContentId(contentLink)
      if (contentLink.locale) context.setLocale(contentLink.locale)

      // Make the shared server context available
      updateSharedServerContext(context)

      // Render the content, with edit mode context
      const isPage =
        contentType.some((x) => x?.toLowerCase() == 'page') ?? false
      const Layout = isPage ? PageLayout : React.Fragment
      const output = (
        <>
          {/* @ts-expect-error */}
          <Script
            src={
              new URL(communicationInjectorPath, client.siteInfo.cmsURL).href
            }
            strategy="afterInteractive"
          />
          <Layout locale={contentItem.locale?.name ?? ''}>
            <OnPageEdit refreshTimeout={refreshTimeout}>
              <RefreshNotice />
            </OnPageEdit>
            <CmsContent
              contentType={contentType}
              contentLink={contentLink}
              fragmentData={contentItem}
              ctx={context}
            />
          </Layout>
          {context.isDebug && (
            <div className="optly-contentLink">
              ContentItem:{' '}
              {contentLink
                ? contentLinkToString(contentLink)
                : 'Invalid content link returned from Optimizely Graph'}
            </div>
          )}
        </>
      )
      return output
    } catch (e) {
      console.error('🔴 [OnPageEdit] Caught error', e)
      return notFound()
    }
  }
  return EditPage
}

export default createEditPageComponent
