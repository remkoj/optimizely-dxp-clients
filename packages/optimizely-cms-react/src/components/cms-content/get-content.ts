import { print } from 'graphql'
import { type ContentLink, type InlineContentLink, type IOptiGraphClient, isContentLink, isInlineContentLink, OptiCmsSchema } from "@remkoj/optimizely-graph-client";
import { CmsComponent, CmsComponentWithFragment } from "../../types.js";
import { CmsContentFragments } from "../../data/queries.js";
import { validatesFragment, contentLinkToRequestVariables, isCmsComponentWithFragment, isCmsComponentWithDataQuery } from "../../utilities.js";

export function getContent<NDL extends boolean = false>(client: IOptiGraphClient | undefined, contentLink: InlineContentLink | ContentLink | undefined, Component: CmsComponent<any> | undefined, fragmentData: Record<string, any> | undefined | null, noDataLoad?: NDL): NDL extends true ? Record<string, any> : Promise<Record<string, any>> {
  const debug = client?.debug ?? false

  // Handle provided fragment
  const componentLabel: string = Component?.displayName ?? Component?.toString() ?? 'undefined'
  const myFragmentData = fragmentData || {}
  const fragmentProps = Object.getOwnPropertyNames(myFragmentData).filter(x => !CmsContentFragments.IContentDataProps.includes(x))
  if (fragmentProps.length > 0) {
    if (debug)
      console.log("⚪ [CmsContent][getContent] Rendering CMS Component using fragment information", fragmentProps)

    if (validatesFragment(Component) && !Component.validateFragment(myFragmentData))
      console.warn("🔴 [CmsContent][getContent] Invalid fragment data received, falling back to loading for ", componentLabel)
    else
      return (noDataLoad ? myFragmentData : Promise.resolve(myFragmentData)) as NDL extends true ? Record<string, any> : Promise<Record<string, any>>
  }

  // No meaningful fragment provided with inline content, warn in debug, but just return an empty dataset
  if (isInlineContentLink(contentLink)) {
    if (debug)
      console.warn(`🟠 [CmsContent][getContent] No data present for inline content item, this may cause errors if your component expects certain fields to be present`)
    return (noDataLoad ? myFragmentData : Promise.resolve(myFragmentData)) as NDL extends true ? Record<string, any> : Promise<Record<string, any>>
  }

  // If no data may be loaded, stop here
  if (noDataLoad) {
    if (debug)
      console.log(`⚪ [CmsContent][getContent] Component of type "${componentLabel}" was prohibited to load data`)
    return myFragmentData as NDL extends true ? Record<string, any> : Promise<Record<string, any>>
  }

  // If we don't have a valid link, stop here
  if (!isContentLink(contentLink)) {
    if (debug)
      console.log(`🔴 [CmsContent][getContent] Unable to load data for "${componentLabel}" without a valid content link`)
    return Promise.resolve(myFragmentData)
  }

  // Return immediately when there's no client
  if (!client) {
    console.log(`🔴 [CmsContent][getContent] Data loading for "${componentLabel}" requires a GraphQL Client`)
    throw new Error(`Data loading for "${componentLabel}" requires a GraphQL Client`)
  }

  if (isCmsComponentWithFragment<any>(Component))
    return getComponentDataFromFragment<any>(Component, contentLink, client).then(data => (data || {}) as Record<string, any>)

  if (isCmsComponentWithDataQuery<any>(Component)) {
    const gqlQuery = Component.getDataQuery()
    const gqlVariables = contentLinkToRequestVariables(contentLink as ContentLink)
    if (client.debug)
      console.log("⚪ [CmsContent] Component data fetching variables:", gqlVariables)
    return client.request<{}>(gqlQuery, gqlVariables).then(gqlResponse => {
      if (client.debug)
        console.log("⚪ [CmsContent] Component requested the following data:", gqlResponse)
      return gqlResponse
    })
  }

  // Assume there's no data load required for the component
  if (client.debug)
    console.log(`⚪ [CmsContent] Component of type "${componentLabel}" did not request loading of data`)
  return Promise.resolve(myFragmentData)
}

export default getContent


async function getComponentDataFromFragment<T extends any = any>(Component: CmsComponentWithFragment<T, Record<string, any>>, contentLink: ContentLink, client: IOptiGraphClient) {
  type FragmentQueryResponse = { contentById: { total: number, items: Array<{ _metadata: { key: string, version: number | string, locale?: string }, _locale?: { name: string } } & T> } }
  const [name, fragment] = Component.getDataFragment()
  if (client.debug) console.log(`⚪ [CmsContent] Component data fetching using fragment: ${name}`)
  const fragmentQuery = client.currentOptiCmsSchema == OptiCmsSchema.CMS12 ?
    `query getContentFragmentById($key: String!, $version: Int, $locale: [Locales!]) { contentById: Content(where: { ContentLink: { GuidValue: { eq: $key }, WorkId: { eq: $version } } }, locale: $locale) { total, items { _type: __typename, _metadata: ContentLink { key: GuidValue, version: WorkId }, _locale: Language { name: Name } ...${name} }}}\n ${print(fragment)}` :
    `query getContentFragmentById($key: String!, $version: String, $locale: [Locales!]) {contentById: _Content(where: {_metadata: {key: { eq: $key }, version: { eq: $version }}} locale: $locale) { total, items { _type: __typename, _metadata { key, version, locale } ...${name} }}}\n ${print(fragment)}`
  const fragmentVariables = contentLinkToRequestVariables(contentLink as ContentLink)
  if (client.currentOptiCmsSchema == OptiCmsSchema.CMS12) {
    try {
      const versionNr = fragmentVariables.version ? Number.parseInt(fragmentVariables.version) : 0
      if (versionNr > 0)
        fragmentVariables.version = versionNr as unknown as string
      else
        fragmentVariables.version = undefined
    } catch {
      fragmentVariables.version = undefined
    }
  }
  if (client.debug) console.log(`⚪ [CmsContent] Component data fetching using variables: ${JSON.stringify(fragmentVariables)}`)
  const fragmentResponse = await client.request<FragmentQueryResponse, any>(fragmentQuery, fragmentVariables)
  const totalItems = fragmentResponse.contentById.total || 0
  if (totalItems < 1)
    throw new Error(`CmsContent expected to load exactly one content item of type ${name}, received ${totalItems} from Optimizely Graph. Content Item: ${JSON.stringify(fragmentVariables)}`)
  if (totalItems > 1 && client.debug) console.warn(`🟠 [CmsContent] Resolved ${totalItems} content items, expected only 1. Picked the first one`)
  if (client.currentOptiCmsSchema == OptiCmsSchema.CMS12) {
    fragmentResponse.contentById.items[0]._metadata.locale = fragmentResponse.contentById.items[0]._metadata.locale ?? fragmentResponse.contentById.items[0]._locale?.name
    if (fragmentResponse.contentById.items[0]._locale)
      delete fragmentResponse.contentById.items[0]._locale
  }
  return fragmentResponse.contentById.items[0]
}