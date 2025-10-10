import { ASTNode, print } from 'graphql'
import { ComponentType } from 'react';
import { type ContentLink, type InlineContentLink, type IOptiGraphClient, isContentLink, isInlineContentLink, OptiCmsSchema } from "@remkoj/optimizely-graph-client";
import { CmsComponent, CmsComponentWithFragment, CmsComponentWithQuery, ContentQueryProps, GetDataQueryResponseTemplate, ProcessQueryResponse } from "../../types.js";
import { CmsContentFragments } from "../../data/queries.js";
import { validatesFragment, contentLinkToRequestVariables, isCmsComponentWithFragment, isCmsComponentWithDataQuery } from "../../utilities.js";

import { getComponentLabel } from './resolve-component.js';

export function getContent<NDL extends boolean = false>(client: IOptiGraphClient | undefined, contentLink: InlineContentLink | ContentLink | undefined, Component: CmsComponent<any> | undefined, fragmentData: Record<string, any> | undefined | null, noDataLoad?: NDL): NDL extends true ? Record<string, any> : Promise<Record<string, any>> {
  const debug = client?.debug ?? false
  const componentLabel: string = getComponentLabel(Component as ComponentType)

  // Handle provided fragment data
  const fragmentProps = fragmentData ? Object.getOwnPropertyNames(fragmentData).filter(x => !CmsContentFragments.IContentDataProps.includes(x)) : []
  if (fragmentData && fragmentProps.length > 0) {
    // Invalid fragment
    if (validatesFragment(Component) && !Component.validateFragment(fragmentData)) {
      if (debug)
        console.warn("🔴 [CmsContent][getContent] Invalid fragment data received, falling back to loading for ", componentLabel)

      // Preview mode, so load data for changeset
    } else if (client?.isPreviewEnabled() && isContentLink(contentLink) && !isInlineContentLink(contentLink)) {
      if (debug)
        console.warn("🔴 [CmsContent][getContent] Rendering shared instance, while in preview mode, falling back to loading for ", componentLabel);
      contentLink.version = null;

      // Default mode, use fragment
    } else {
      return (noDataLoad ? fragmentData : Promise.resolve(fragmentData)) as NDL extends true ? Record<string, any> : Promise<Record<string, any>>
    }
  }

  // No meaningful fragment provided with inline content, warn in debug, but just return an empty dataset
  if (isInlineContentLink(contentLink)) {
    if (debug)
      console.warn(`🟠 [CmsContent][getContent] No data present for inline content item, this may cause errors if your component expects certain fields to be present`)
    return (noDataLoad ? fragmentData ?? {} : Promise.resolve(fragmentData ?? {})) as NDL extends true ? Record<string, any> : Promise<Record<string, any>>
  }

  // Stop before running any Async operation if we're not loading data
  if (noDataLoad)
    return (noDataLoad ? {} : Promise.resolve({})) as NDL extends true ? Record<string, any> : Promise<Record<string, any>>

  // If we don't have a valid link, stop here
  if (!isContentLink(contentLink)) {
    if (debug)
      console.warn(`🟠 [CmsContent][getContent] Unable to load data for "${componentLabel}" without a valid content link`)
    return Promise.resolve({})
  }

  // Return immediately when there's no client
  if (!client) {
    console.error(`🔴 [CmsContent][getContent] Data loading for "${componentLabel}" requires a GraphQL Client`)
    throw new Error(`Data loading for "${componentLabel}" requires a GraphQL Client`)
  }

  if (isCmsComponentWithDataQuery<any>(Component))
    return getComponentDataFromQuery<Record<string, any>>(Component, contentLink, client)

  if (isCmsComponentWithFragment<any>(Component))
    return getComponentDataFromFragment<any>(Component, contentLink, client).then(data => (data || {}) as Record<string, any>)

  return Promise.resolve({})
}

export default getContent

async function getComponentDataFromQuery<T extends Record<string, any>>(Component: CmsComponentWithQuery<T, Record<string, any>>, contentLink: ContentLink | undefined, client: IOptiGraphClient): Promise<ProcessQueryResponse<T>> {
  const gqlQuery = Component.getDataQuery()
  const gqlVariables = contentLinkToRequestVariables(contentLink as ContentLink, client)

  // Run the Query
  const responseData = await client.request<T, Omit<ContentQueryProps<string>, "path" | "domain">>(gqlQuery, gqlVariables);

  // See if this is a templated response, if so return the selected fields.
  if (isTemplatedResponse(responseData)) {
    const responseItem = responseData.data?.item as NonNullable<NonNullable<Required<GetDataQueryResponseTemplate>["data"]>["item"]>

    // Transform CMS 12 results
    if (client.currentOptiCmsSchema == OptiCmsSchema.CMS12 && responseItem._locale?.name) {
      const metadata = responseItem._metadata ?? {}
      metadata.locale = responseItem._locale?.name
      responseItem._metadata = metadata
      delete responseItem._locale
    }
    return responseItem as ProcessQueryResponse<T>
  }

  // Otherwise return the raw result
  return responseData as ProcessQueryResponse<T>
}

function isTemplatedResponse(responseData: Record<string, any>): responseData is GetDataQueryResponseTemplate {
  if (!responseData || typeof (responseData) !== 'object')
    return false;
  const responseKey = (responseData as GetDataQueryResponseTemplate)?.data?.item?._metadata?.key
  return typeof (responseKey) === 'string' && responseKey.length > 0
}

async function getComponentDataFromFragment<T extends any = any>(Component: CmsComponentWithFragment<T, Record<string, any>>, contentLink: ContentLink, client: IOptiGraphClient) {
  // Build the Query and variables
  type FragmentQueryResponse = { contentById: { total: number, items: Array<{ _metadata: { key: string, version: number | string, locale?: string }, _locale?: { name: string } } & T> } }
  const [name, fragment] = Component.getDataFragment()
  const gqlQuery = client.currentOptiCmsSchema == OptiCmsSchema.CMS12 ? buildCms12Query(name, fragment) : buildCms13Query(name, fragment)
  const gqlVariables = contentLinkToRequestVariables(contentLink as ContentLink, client)

  // Run the Query
  const fragmentResponse = await client.request<FragmentQueryResponse, any>(gqlQuery, gqlVariables)

  // Check the result count
  const totalItems = fragmentResponse.contentById.total || 0
  if (totalItems < 1)
    throw new Error(`CmsContent expected to load exactly one content item of type ${name}, received ${totalItems} from Optimizely Graph. Content Item: ${JSON.stringify(gqlVariables)}`)
  if (totalItems > 1 && client.debug) console.warn(`🟠 [CmsContent] Resolved ${totalItems} content items, expected only 1. Picked the first one`)

  // Transform CMS 12 results
  if (client.currentOptiCmsSchema == OptiCmsSchema.CMS12) {
    fragmentResponse.contentById.items[0]._metadata.locale = fragmentResponse.contentById.items[0]._metadata.locale ?? fragmentResponse.contentById.items[0]._locale?.name
    if (fragmentResponse.contentById.items[0]._locale)
      delete fragmentResponse.contentById.items[0]._locale
  }

  // Return the item
  return fragmentResponse.contentById.items[0]
}

const buildCms12Query = (name: string, fragment: ASTNode | string) => `query getContentFragmentById($key: String!, $version: Int, $locale: [Locales!]) { contentById: Content(where: { ContentLink: { GuidValue: { eq: $key }, WorkId: { eq: $version } } }, locale: $locale) { total, items { _type: __typename, _metadata: ContentLink { key: GuidValue, version: WorkId }, _locale: Language { name: Name } ...${name} }}}\n${typeof (fragment) == 'string' ? fragment : print(fragment)}`
const buildCms13Query = (name: string, fragment: ASTNode | string) => `query getContentFragmentById($key: [String!]!, $version: String, $locale: [Locales!], $changeset: String, $variation: VariationInput) {
  contentById: _Content(
    ids: $key
    locale: $locale
    variation: $variation
    where: { _metadata: { changeset: { eq: $changeset }, version: { eq: $version } } }
  ) {
    total
    items {
      _type: __typename
      __typename
      _metadata {
        key
        version
        locale
        variation
        changeset
      }
      ...${name}
    }
  }
}
${typeof (fragment) == 'string' ? fragment : print(fragment)}`