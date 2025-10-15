import { gql } from 'graphql-request'
import type { Route, VariationInput } from './types.js'

export type Variables = {
  path: Array<string>
  domain?: string | null,
  changeset?: string | null,
  status?: string | null,
  variation?: VariationInput | null
}

export type Result = {
  getRouteByPath: {
    total: number
    item: Route
  }
}

export const query = gql`query getRouteByPath($path: [String!]!, $domain: String, $changeset: String, $status: String, $variation: VariationInput) {
  getRouteByPath: _Page(
    where: {
      _metadata: {
        url: { default: { in: $path }, base: { endsWith: $domain } }
        changeset: { eq: $changeset }
        status: { eq: $status }
      }
    }
    variation: $variation
    orderBy: { _metadata: { url: { default: ASC } } }
  ) {
    total
    item {
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
