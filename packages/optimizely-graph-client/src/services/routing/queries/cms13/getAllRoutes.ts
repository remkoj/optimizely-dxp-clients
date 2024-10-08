import { gql } from "graphql-request"

export type Route = {
    _metadata: {
        key: string
        version: string
        locale: string
        displayName: string
        types: Array<string>
        url: {
            path: string
            domain: string
        }
        slug?: string | null
    }
    changed: string
}

export type Result = {
    Content: {
        items: Route[],
        cursor: string,
        total: number
    }
}

export type Variables = {
    cursor?: string,
    pageSize?: number,
    typeFilter?: string | string[]
    domain?: string
}

export const query = gql`query GetAllRoutes($cursor: String, $pageSize: Int = 100, $typeFilter: [String] = "_Page", $domain: String) {
    Content: _Content(
        where: {
            _metadata: {
                url: { hierarchical: { exist: true }, base: { eq: $domain } }
                types: { in: $typeFilter }
            }
        }
        limit: $pageSize
        cursor: $cursor
    ) {
        items {
            _metadata {
                key
                version
                locale
                displayName
                types
                url {
                    path: hierarchical
                    domain: base
                }
                ... on IInstanceMetadata {
                    slug: routeSegment
                }
                ... on IMediaMetadata {
                    slug: routeSegment
                }
            }
            changed: _modified
        }
        cursor
        total
    }
}`