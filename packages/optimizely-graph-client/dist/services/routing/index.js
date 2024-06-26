import { gql } from "graphql-request";
import createClient, { isContentGraphClient } from '../../client/index.js';
export class RouteResolver {
    /**
     * Create a new Route Resolver
     *
     * @param client        ContentGraph configuration override
     * @param apolloConfig  Apollo Client configuration override
     */
    constructor(clientOrConfig) {
        this._cgClient = isContentGraphClient(clientOrConfig) ? clientOrConfig : createClient(clientOrConfig);
    }
    async getRoutes(siteId) {
        this._cgClient.updateFlags({ queryCache: false }, true);
        let page = await this._cgClient.request(GetAllRoutes.query, { siteId, typeFilter: "Page" });
        let results = page?.Content?.items ?? [];
        const totalCount = page?.Content?.total ?? 0;
        const cursor = page?.Content?.cursor ?? '';
        if (totalCount > 0 && cursor !== '' && totalCount > results.length)
            while ((page?.Content?.items?.length ?? 0) > 0 && results.length < totalCount) {
                page = await this._cgClient.request({
                    document: GetAllRoutes.query,
                    variables: {
                        cursor,
                        siteId,
                        typeFilter: "Page"
                    }
                });
                results = results.concat(page.Content?.items ?? []);
            }
        this._cgClient.restoreFlags();
        return results.map(this.tryConvertResponse.bind(this)).filter(this.isNotNullOrUndefined);
    }
    async getContentInfoByPath(path, siteId) {
        if (this._cgClient.debug)
            console.log(`Resolving content info for ${path} on ${siteId ? "site " + siteId : "all sites"}`);
        const resultSet = await this._cgClient.request({
            document: GetRouteByPath.query,
            variables: {
                path,
                siteId
            }
        });
        if ((resultSet.Content?.items?.length ?? 0) === 0) {
            if (this._cgClient.debug)
                console.warn("No items in the resultset");
            return undefined;
        }
        if ((resultSet.Content?.items?.length ?? 0) > 1)
            throw new Error("Ambiguous URL provided, did you omit the siteId in a multi-channel setup?");
        if (this._cgClient.debug)
            console.log(`Resolved content info for ${path} to:`, resultSet.Content.items[0]);
        return this.convertResponse(resultSet.Content.items[0]);
    }
    async getContentInfoById(contentId, locale) {
        const [id, workId] = this.parseIdString(contentId);
        const variables = {
            id,
            workId,
            locale: locale.replaceAll('-', '_')
        };
        if (this._cgClient.debug)
            console.log("Resolving content by id:", JSON.stringify(variables));
        const resultSet = await this._cgClient.request({
            document: GetRouteById.query,
            variables
        });
        if (resultSet.Content?.total >= 1) {
            if (this._cgClient.debug && resultSet.Content?.total > 1)
                console.warn(`Received multiple entries with this ID, returning the first one from: ${(resultSet.Content?.items || []).map(x => { return `${x.contentLink.id}_${x.contentLink.workId}_${x.locale.name}`; }).join('; ')}`);
            return this.convertResponse(resultSet.Content.items[0]);
        }
        return undefined;
    }
    routeToContentLink(route) {
        return {
            id: route.id,
            workId: route.workId,
            guidValue: route.guid,
            locale: route.language
        };
    }
    parseIdString(id) {
        let cId = -1;
        let workId = null;
        if (id.indexOf("_") > 0) {
            [cId, workId] = id.split("_").map(x => {
                try {
                    return Number.parseInt(x, 10);
                }
                catch {
                    return -1;
                }
            });
            if (workId < 0)
                workId = null;
        }
        else {
            try {
                cId = Number.parseInt(id, 10);
            }
            catch {
                cId = -1;
            }
        }
        return [cId, workId];
    }
    convertResponse(item) {
        return {
            // Take the GQL response
            ...item,
            // Then add/override the needed fields
            url: new URL(item.url),
            id: item.contentLink?.id || 0,
            workId: item.contentLink?.workId,
            guid: item.contentLink?.guidValue || "",
            language: item.locale.name,
            published: item.published ? new Date(item.published) : null,
            changed: item.changed ? new Date(item.changed) : null
        };
    }
    tryConvertResponse(item) {
        try {
            return this.convertResponse(item);
        }
        catch (e) {
            console.error(`Unable to convert ${JSON.stringify(item)} to Route`, e);
            return undefined;
        }
    }
    isNotNullOrUndefined(input) {
        return input != null && input != undefined;
    }
}
export default RouteResolver;
export var GetAllRoutes;
(function (GetAllRoutes) {
    GetAllRoutes.query = gql `query GetAllRoutes($cursor: String, $pageSize: Int = 100, $typeFilter: [String] = "Page", $siteId: String = null)
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
}`;
})(GetAllRoutes || (GetAllRoutes = {}));
export var GetRouteByPath;
(function (GetRouteByPath) {
    GetRouteByPath.query = gql `query GetRouteByPath($path: String!, $siteId: String) {
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
  }`;
})(GetRouteByPath || (GetRouteByPath = {}));
export var GetRouteById;
(function (GetRouteById) {
    GetRouteById.query = gql `query GetRouteById($id: Int!, $workId: Int, $locale: [Locales]!) {
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
  }`;
})(GetRouteById || (GetRouteById = {}));
//# sourceMappingURL=index.js.map