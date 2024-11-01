import type { GetContentByIdMethod, GetContentByIdData } from './types.js'
import type { ContentQueryProps } from '@remkoj/optimizely-cms-react/rsc'
import { type GraphQLClient , gql } from 'graphql-request'

export const getContentById : GetContentByIdMethod = async <LocaleType = string>(client: GraphQLClient, variables: ContentQueryProps<LocaleType>) =>
{
    return await client.request<GetContentByIdData<LocaleType>, ContentQueryProps<LocaleType>>(gqlQuery, variables)
}

const gqlQuery = gql`query getContentByIdBase($key: String!, $version: String, $locale: [Locales!], $path: String, $domain: String) {
    content: _Content(
        where: {
            _or: [
                { _metadata: { key: { eq: $key }, version: { eq: $version } } }
                { _metadata: { url: { hierarchical: { eq: $path }, base: { eq: $domain } }, version: { eq: $version } } }
            ]
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
            _type: __typename
        }
    }
}`