import 'server-only'

import type {
  EditPageProps,
  EditPageComponent,
  EditViewOptions,
  EditViewPageLayout
} from './types.js'
import {
  contentLinkToString,
} from '@remkoj/optimizely-graph-client/utils'
import {
  ServerContext,
  CmsContent,
  OptimizelyComposition,
  isNode,
  type CompositionNode,
  type ComponentFactory,
} from '@remkoj/optimizely-cms-react/rsc'
import { notFound } from 'next/navigation.js'
import OnPageEdit from '../components/on-page-edit.js'
import { createAuthorizedClient } from '../client.js'
import { type JSX } from 'react'
import Script from 'next/script.js'
import { getContentRequest, isValidRequest } from './tools.js'
import loadContent from './load-content.js'

const EmptyPageLayout : EditViewPageLayout = ({ children }) => <>{children}</>

const defaultOptions: EditViewOptions<string> = {
  refreshNotice: () => <></>,
  layout: EmptyPageLayout,
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
      console.log('⚪ [OnPageEdit] Requested content:', JSON.stringify(contentRequest))
    }

    try {

      const { contentLink, contentItem, contentType } = await loadContent(contentRequest, client, getContentById)

      if (context.isDebug) {
        console.log('⚪ [OnPageEdit] Identified content:', JSON.stringify(contentLink))
        console.log('⚪ [OnPageEdit] Content type:', contentType)
      }

      // Store the editable content so it can be tested
      context.setEditableContentId(contentLink)
      if (contentLink.locale) context.setLocale(contentLink.locale)

      // Determine rendering flow controls
      const isPage    = contentType?.some(x => x?.toLowerCase().replace(/^_/, '') === 'page') ?? false;
      const isSection = contentType?.some(x => x?.toLowerCase().replace(/^_/, '') === 'section') ?? false;
      const sectionData = isSection && isNode(contentItem?.composition) ? contentItem.composition as CompositionNode : undefined;
      if (sectionData) {
        if (contentItem?.composition)
          delete contentItem.composition
        sectionData.component = contentItem
        context.setEditableContentIsExperience(true)
      }

      // Prepare communication injector
      const injectorUrl = new URL(communicationInjectorPath, client.siteInfo.cmsURL).href

      // Render edit page
      const Layout = isPage ? PageLayout : EmptyPageLayout
      const output = (
        <>
          {/* @ts-expect-error */}
          <Script src={ injectorUrl } strategy="afterInteractive"/>
          <Layout locale={contentLink?.locale ?? ''} ctx={context}>
            <OnPageEdit refreshTimeout={refreshTimeout}>
              <RefreshNotice />
            </OnPageEdit>
            { sectionData ?
              <OptimizelyComposition node={sectionData} ctx={context} /> :
              <CmsContent contentType={contentType} contentLink={contentLink} fragmentData={contentItem} ctx={context} />
            }
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
