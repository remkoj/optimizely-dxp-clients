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
    total: number
  }
}

export type Variables = {
  skip?: number,
  pageSize?: number,
  typeFilter?: string | string[]
  domain?: string
  mustHaveDomain?: boolean | null
}

export const query = gql`query GetAllRoutes($skip: Int = 0, $pageSize: Int = 100, $typeFilter: [String] = "_Page", $domain: String, $mustHaveDomain: Boolean) {
  Content: _Page(
    where: {
      _metadata: {
        url: { hierarchical: { exist: true }, base: { eq: $domain, exist: $mustHaveDomain } }
        types: { in: $typeFilter }
      }
    }
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