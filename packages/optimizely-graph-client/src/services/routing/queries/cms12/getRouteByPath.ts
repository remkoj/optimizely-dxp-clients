import { gql } from "graphql-request"
import type * as GetAllRoutes from './getAllRoutes.js'

export type Variables = {
    path: string
    siteId?: string | null
}
export type Result = {
    Content: {
        total: number
        items: GetAllRoutes.Route[]
    }
}
export const query = gql`query GetRouteByPath($path: String!, $siteId: String) {
Content(
  where: {
    _and: {
      RelativePath: {
        eq: $path
      },
      SiteId: {
        eq:$siteId
      }
    }
  }
)
{
  total,
  items {
    route: RelativePath
    url: Url
    locale:Language { name: Name }
    contentLink: ContentLink { id: Id, workId: WorkId, guidValue: GuidValue }
    name: Name,
    contentType: ContentType,
    slug: RouteSegment,
    changed: Changed,
    published: StartPublish
    siteId: SiteId
  }
}
}`