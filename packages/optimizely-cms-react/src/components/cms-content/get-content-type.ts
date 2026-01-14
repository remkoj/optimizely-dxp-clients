import { isContentLink, isInlineContentLink, contentLinkToString, type IOptiGraphClient, type ContentLink, type InlineContentLink } from "@remkoj/optimizely-graph-client"
import type { ContentType } from "../../types.js"
import { gql } from 'graphql-request'
import { contentLinkToRequestVariables, normalizeContentType } from "../../utilities.js"

export type ContentTypeResolver = (type: ContentType | null | undefined, link: ContentLink, gqlClient: IOptiGraphClient) => PromiseLike<ContentType | undefined>

export function valueToPromiseLike<T>(value: T): PromiseLike<T> {
  const pl: PromiseLike<T> = {
    then: <TResult1 = T>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined) => {
      if (!onfulfilled)
        return value as unknown as PromiseLike<TResult1>
      return onfulfilled(value) as PromiseLike<TResult1>
    }
  }
  return pl
}

/**
 * Resolve the ContentType of an Optimizely CMS Component, identified by its content link
 * 
 * @param       link        The ContentLink of the content item
 * @param       gqlClient   The GraphQL client to use
 * @returns     The ContentType, or undefined if it cannot be resolved
 */
export async function getContentType(link: ContentLink | InlineContentLink, gqlClient: IOptiGraphClient): Promise<ContentType | undefined> {
  if (isInlineContentLink(link)) {
    console.error(`🔴 [CmsContent][getContentType] Unable to dynamically resolve the content type for inline content items: ${contentLinkToString(link)}`)
    throw new Error(`Unable to dynamically resolve the content type for inline content items: ${contentLinkToString(link)}`)
  }

  if (!isContentLink(link)) {
    console.error(`🔴 [CmsContent][getContentType] The provided link is not a valid content link: ${contentLinkToString(link)}`)
    throw new Error(`The provided link is not a valid content link: ${contentLinkToString(link)}`)
  }

  const gqlQueryVars = contentLinkToRequestVariables(link, gqlClient)
  const gqlResponse = await gqlClient.request<GetContentTypeResponse>(getContentTypeQuery, gqlQueryVars)
  if (gqlResponse.Content?.total != 1) {
    if (gqlClient.debug)
      console.error(`🔴 [CmsContent][getContentType] Expected exactly one type, received ${gqlResponse.Content?.total ?? 0} types for`, gqlQueryVars)
    return undefined
  }

  const contentType = normalizeContentType(gqlResponse.Content?.item?.metadata?.types)
  if (!contentType) {
    console.error(`🔴 [CmsContent][getContentType] The item did not contain type information! (${contentLinkToString(link)})`)
    throw new Error("The item did not contain type information")
  }

  return contentType
}

export default getContentType

type GetContentTypeResponse = {
  Content: {
    item: Partial<{
      metadata: Partial<{
        types: string[]
      }>
    }>
    total: number
  }
}

const getContentTypeQuery = gql`query getContentType($key: [String!]!, $version: String, $locale: [Locales!], $changeset: String, $variation: VariationInput)
{
  Content: _Content(
    ids: $key
    locale: $locale
    variation: $variation
    where: { _metadata: { changeset: { eq: $changeset }, version: { eq: $version } } }
  ) {
    item {
    	metadata: _metadata {
        types
      }
    },
    total
  }
}`
