import { gql } from "graphql-request"
import { type Route } from "./getAllRoutes.js"

export type Variables = {
    path: string
    domain?: string | null
}

export type Result = {
    getRouteByPath: {
        total: number
        items: Route[]
    }
}

export const query = gql`query getRouteByPath($path: String!, $domain: String) {
    getRouteByPath: _Content(
        where: { _metadata: { url: { default: { eq: $path }, base: { endsWith: $domain } } } }
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