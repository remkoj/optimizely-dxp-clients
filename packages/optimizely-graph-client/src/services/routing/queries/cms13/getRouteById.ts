import { gql } from "graphql-request"
import { VariationInput, type Route } from "./types.js"

export type Variables = {
  key: string,
  version?: string | null,
  locale?: Array<string | null> | string | null
  changeset?: string | null
  variation?: VariationInput | null
}

export type Result = {
  Content: {
    total: number
    items: Route[]
  }
}

export const query = gql`query GetRouteById($key: [String!]!, $version: String, $locale: [Locales], $changeset: String, $variation:VariationInput) {
  Content: _Content(
    ids: $key
    locale: $locale
    variation: $variation
    where: {
      _metadata: { changeset: { eq: $changeset }, version: { eq: $version } }
    }
  ) {
    total
    items {
      _metadata {
        key
        version
        locale
        displayName
        variation
        changeset
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