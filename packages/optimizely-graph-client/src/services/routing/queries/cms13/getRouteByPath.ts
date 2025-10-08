import { gql } from "graphql-request"
import type { Route, VariationInput } from "./types.js"

export type Variables = {
  path: string | string[]
  domain?: string | null
  changeset?: string | null
  variation?: VariationInput | null
}

export type Result = {
  getRouteByPath: {
    total: number
    items: Route
  }
}

export const query = gql`query getRouteByPath($path: [String!]!, $domain: String, $changeset: String, $variation: VariationInput) {
  getRouteByPath: _Page(
    where: {
      _and: [
        {
          _metadata: {
            url: { default: { in: $path }, base: { endsWith: $domain } }
            changeset: { eq: $changeset }
            status: { eq: "Published" }
          }
        }
      ]
    }
    variation: $variation
    orderBy: { _metadata: { url: { default: ASC } } }
  ) {
    total
    items: item {
      _metadata {
        key
        version
        locale
        displayName
        variation
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
        changeset
      }
      changed: _modified
    }
  }
}`