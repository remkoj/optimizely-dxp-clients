import { gql } from "graphql-request"
import { type IOptiGraphClient } from "@remkoj/optimizely-graph-client"

export type GetContentByPathVariables<LocaleType = string> = {
  path: string | string[],
  locale?: Array<LocaleType> | LocaleType,
  siteId?: string,
  changeset?: string | null
}

type MayBe<T> = T extends Array<infer R> ? Array<R | null> | null : T | null

export type GetContentByPathResponse = {
  content?: MayBe<{
    items?: MayBe<Array<{
      __typename?: MayBe<string>
      _type?: MayBe<string>
    } & Record<string, any>>>
  }>
}

export type GetMetaDataByPathResponse = {
  getGenericMetaData?: {
    items?: Array<{
      name?: string,
      alternatives?: Array<{
        locale?: string | null
        href?: string | null
      } | null> | null
      canonical?: string | null
    } | null>
  }
}

export type GetContentByPathMethod<LocaleType = string> = (client: IOptiGraphClient, variables: GetContentByPathVariables<LocaleType>) => Promise<GetContentByPathResponse>
export type GetMetaDataByPathMethod<LocaleType = string> = (client: IOptiGraphClient, variables: GetContentByPathVariables<LocaleType>) => Promise<GetMetaDataByPathResponse>

export const getMetaDataByPath: GetMetaDataByPathMethod = (client, variables) => {
  if (client.debug)
    console.log("⚪ [CmsPage.getMetaDataByPath] Running fallback query with parameters:", variables)
  return client.request<GetMetaDataByPathResponse, GetContentByPathVariables>(metadataQuery, variables)
}

export const getContentByPath: GetContentByPathMethod = (client, variables) => {
  if (client.debug)
    console.log("⚪ [CmsPage.getContentByPath] Running fallback query with parameters:", variables)
  return client.request<GetContentByPathResponse, GetContentByPathVariables>(contentQuery, variables)
}

export default getContentByPath

const contentQuery = gql`query getContentByPathBase($path: [String!]!, $domain: String, $locale: [Locales], $changeset: String) {
  content: _Content(
    where: {
      _metadata: {
        url: { default: { in: $path }, base: { endsWith: $domain } }
        changeset: { eq: $changeset }
      }
    }
    locale: $locale
  ) {
    total
    items {
      _metadata {
        key
        locale
        types
        displayName
        version
      }
      __typename,
      _type: __typename
    }
  }
}`

const metadataQuery = gql`query getGenericMetaData($path: String!, $locale: [Locales], $siteId: String) {
    getGenericMetaData: Content (
        where: { RelativePath: { eq: $path }, SiteId: { eq: $siteId } }
        locale: $locale
    ) {
        items {
            name: Name,
            alternatives: ExistingLanguages {
                locale: Name
                href: Link
            }
            canonical: Url
        }
    }
}`