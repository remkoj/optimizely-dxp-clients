import { gql, GraphQLClient } from "graphql-request"

export type GetContentByPathVariables<LocaleType = string> = {
    path: string,
    locale?: Array<LocaleType | null> | LocaleType | null,
    siteId?: string | null
}

type MayBe<T> = T extends Array<infer R> ? Array<R | null> | null : T | null

export type GetContentByPathResponse<LocaleType = string> = {
    content?: MayBe<{
        items?: MayBe<Array<{
            _metadata?: MayBe<{
                key?: MayBe<string>
                locale?: MayBe<LocaleType>
                types?: MayBe<Array<string>>
                displayName?: MayBe<string>
                version?: MayBe<string>
            }>
            _type?: MayBe<string>
        }>>
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

export type GetContentByPathMethod<LocaleType = string> = (client: GraphQLClient, variables: GetContentByPathVariables<LocaleType>) => Promise<GetContentByPathResponse<LocaleType>>
export type GetMetaDataByPathMethod<LocaleType = string> = (client: GraphQLClient, variables: GetContentByPathVariables<LocaleType>) => Promise<GetMetaDataByPathResponse>

export const getMetaDataByPath: GetMetaDataByPathMethod = (client, variables) =>
{
    return client.request<GetMetaDataByPathResponse,GetContentByPathVariables>(metadataQuery, variables)
}

export const getContentByPath: GetContentByPathMethod = (client, variables) =>
{
    return client.request<GetContentByPathResponse,GetContentByPathVariables>(contentQuery, variables)
}

export default getContentByPath

const contentQuery = gql`query getContentByPathBase($path: String!, $domain: String, $locale: [Locales]) {
    content: Content(
        where: { _metadata: { url: { hierarchical: { eq: $path }, base: { eq: $domain } } } }
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