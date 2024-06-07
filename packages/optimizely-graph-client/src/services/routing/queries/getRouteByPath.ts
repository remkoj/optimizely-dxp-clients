import { gql } from "graphql-request"
import { type Route } from "./getAllRoutes.js"

export type Variables = {
    path: string
    domain?: string | null
}

export type Result = {
    Content: {
        total: number
        items: Route[]
    }
}

export const query = gql`query GetRouteByPath($path: String!, $domain: String) {
    _Content(
        where: { _metadata: { url: { default: { eq: $path }, base: { eq: $domain } } } }
    ) {
        total
        items {
            _metadata {
                key
                version
                locale
                displayName
                types
                url {
                    path: default
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
    }
}`