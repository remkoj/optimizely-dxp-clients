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
  changeset?: string | null
}

export const query = gql`query GetAllRoutes($cursor: String, $pageSize: Int = 100, $typeFilter: [String] = "_Page", $domain: String, $changeset: String) {
  Content: _Content(
    where: {
      _metadata: {
        url: { default: { exist: true }, base: { endsWith: $domain } }
        types: { in: $typeFilter }
        changeset: { eq: $changeset }
      }
    }
    orderBy: { _metadata: { url: { default: ASC } } }
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
    cursor
    total
  }
}`