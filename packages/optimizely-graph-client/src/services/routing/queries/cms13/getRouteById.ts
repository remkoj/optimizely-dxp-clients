import { gql } from "graphql-request"
import { type Route } from "./getAllRoutes.js"

export type Variables = {
  key: string,
  version?: string | null,
  locale?: Array<string | null> | string | null
  changeset?: string | null
}

export type Result = {
  Content: {
    total: number
    items: Route[]
  }
}

export const query = gql`query GetRouteById($key: String!, $version: String, $locale: [Locales], $changeset: String) {
  Content: _Content(
    where: {
      _metadata: { key: { eq: $key }, version: { eq: $version }, changeset: { eq: $changeset } }
    }
    locale: $locale
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
  }
}`