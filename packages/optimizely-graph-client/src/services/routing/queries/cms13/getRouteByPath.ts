import { gql } from "graphql-request"
import { type Route } from "./getAllRoutes.js"

export type Variables = {
  path: string | string[]
  domain?: string | null
}

export type Result = {
  getRouteByPath: {
    total: number
    items: Route[]
  }
}

export const query = gql`query getRouteByPath($path: [String!]!, $domain: String, $changeset: String) {
  getRouteByPath: _Page(
    where: {
      _metadata: {
        url: { default: { in: $path }, base: { endsWith: $domain } }
        changeset: { eq: $changeset }
      }
    }
    orderBy: { _metadata: { url: { default: ASC } } }
  ) {
    total
    items: item {
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
        changeset
      }
      changed: _modified
    }
  }
}`