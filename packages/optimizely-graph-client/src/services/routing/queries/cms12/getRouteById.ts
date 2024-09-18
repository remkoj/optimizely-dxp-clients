import { gql } from "graphql-request"
import type * as GetAllRoutes from './getAllRoutes.js'

export type Variables = {
    id: number,
    workId?: number | null,
    locale?: string | string[]
}
export type Result = {
    Content: {
        total: number
        items: GetAllRoutes.Route[]
    }
}

export const query = gql`query GetRouteById($id: Int!, $workId: Int, $locale: [Locales]!) {
Content(
  where: {
    ContentLink: {
      Id: {
        eq: $id
      }
      WorkId: {
        eq: $workId
      }
    }
  },
  locale: $locale
  limit: 1,
  orderBy: {
    ContentLink: {
        WorkId: DESC
    }
    Status: ASC
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