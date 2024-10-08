import { gql } from "graphql-request"

export type Route = {
    path: string
    siteId: string
    locale: { name: string}
    contentLink: { id?: number | null, workId?: number | null, guidValue?: string | null }
    name: string
    contentType: string[]
    slug: string
    changed: string
    published: string
    url: string
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
    siteId?: string
}

export const query = gql`query GetAllRoutes($cursor: String, $pageSize: Int = 100, $typeFilter: [String] = "Page", $siteId: String = null)
{
Content(
    where: {
        _and: {
            _and: {
                RelativePath: { exist: true }
                ContentType: { in: $typeFilter }
                SiteId: { eq: $siteId }
            }
            RelativePath: { notIn: [""] }
        }
    },
    limit: $pageSize,
    cursor: $cursor
) {
    items {
    path: RelativePath
    locale:Language { name: Name }
    contentLink: ContentLink { id: Id, workId: WorkId, guidValue: GuidValue }
    name: Name
    contentType: ContentType
    slug: RouteSegment
    changed: Changed
    published: StartPublish
    siteId: SiteId
    url: Url
    },
    cursor,
    total
}
}`