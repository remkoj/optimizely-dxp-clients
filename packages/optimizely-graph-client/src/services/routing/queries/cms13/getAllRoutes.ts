import { gql } from "graphql-request"
import type { Route, VariationInput } from "./types.js"

export type Result = {
  Content: {
    items: Route[],
    total: number
  }
}

export type Variables = {
  skip?: number,
  pageSize?: number,
  typeFilter?: string | string[]
  domain?: string
  mustHaveDomain?: boolean | null
  changeset?: string | null
  variation?: VariationInput | null
}

export const query = gql`query GetAllRoutes($skip: Int = 0, $pageSize: Int = 100, $typeFilter: [String] = "_Page", $domain: String, $mustHaveDomain: Boolean, $changeset: String, $variation:VariationInput) {
  Content: _Page(
    where: {
      _metadata: {
        url: { default: { exist: true }, base: { eq: $domain, exist: $mustHaveDomain } }
        types: { in: $typeFilter }
        changeset: { eq: $changeset }
        status: { eq: "Published" }
      }
    }
    variation: $variation
    limit: $pageSize
    skip: $skip
  ) {
    total
    items {
      _metadata {
        key
        version
        locale
        displayName
        types
        variation
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