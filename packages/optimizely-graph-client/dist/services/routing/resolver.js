// Import GraphQL Client
import createClient, { isContentGraphClient } from '../../client/index.js';
// Import GraphQL Queries
import * as GetRouteById from './queries/getRouteById.js';
import * as GetAllRoutes from './queries/getAllRoutes.js';
import * as GetRouteByPath from './queries/getRouteByPath.js';
// Main router class
/**
 *
 */
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
    /**
     * Retrieve all registered routes for the provided domain - all domains if none specified
     *
     * @param       domain      The domain to filter on
     * @returns     The list of routes
     */
    async getRoutes(domain) {
        this._cgClient.updateFlags({ queryCache: false }, true);
        let page = await this._cgClient.request(GetAllRoutes.query, { domain }).catch(e => {
            if (this._cgClient.debug)
                console.error("[RouteResolver] Error while fetching routes", e);
            return undefined;
        });
        let results = page?.Content?.items ?? [];
        const totalCount = page?.Content?.total ?? 0;
        const cursor = page?.Content?.cursor ?? '';
        if (totalCount > 0 && cursor !== '' && totalCount > results.length)
            while ((page?.Content?.items?.length ?? 0) > 0 && results.length < totalCount) {
                page = await this._cgClient.request({
                    document: GetAllRoutes.query,
                    variables: {
                        cursor,
                        domain
                    }
                });
                results = results.concat(page.Content?.items ?? []);
            }
        this._cgClient.restoreFlags();
        return results.map(this.tryConvertResponse.bind(this)).filter(this.isNotNullOrUndefined);
    }
    /**
     * Retrieve route details by path
     *
     * @param       path
     * @param       domain
     * @returns     The route information for the path
     */
    async getContentInfoByPath(path, domain) {
        if (this._cgClient.debug)
            console.log(`Resolving content info for ${path} on ${domain ? domain : "all domains"}`);
        const resultSet = await this._cgClient.request({
            document: GetRouteByPath.query,
            variables: { path, domain }
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
    async getContentInfoById(key, locale, version) {
        const variables = { key, version: version?.toString(), locale: locale?.replaceAll('-', '_') };
        if (this._cgClient.debug)
            console.log("Resolving content by id:", JSON.stringify(variables));
        const resultSet = await this._cgClient.request({
            document: GetRouteById.query,
            variables
        });
        if (resultSet.Content?.total >= 1) {
            if (this._cgClient.debug && resultSet.Content?.total > 1)
                console.warn(`Received multiple entries with this ID, returning the first one from: ${(resultSet.Content?.items || []).map(x => { return `${x._metadata.key} (version: ${x._metadata.version}, locale: ${x._metadata.locale})`; }).join('; ')}`);
            return this.convertResponse(resultSet.Content.items[0]);
        }
        return undefined;
    }
    /**
     * Extract a content link from a route definition
     *
     * @param       route   The route to parse
     * @returns     The ContentLink, with locale information
     */
    routeToContentLink(route) {
        return {
            key: route.key,
            version: route.version,
            locale: route.locale
        };
    }
    convertResponse(item) {
        let itemUrl = new URL('http://localhost');
        try {
            itemUrl = new URL(item._metadata.url.path, item._metadata.url.domain);
        }
        catch (e) {
            //Ignore
        }
        return {
            locale: item._metadata.locale,
            path: item._metadata.url.path,
            url: itemUrl,
            slug: "",
            changed: item.changed ? new Date(item.changed) : null,
            contentType: item._metadata.types,
            version: item._metadata.version,
            key: item._metadata.key
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
//# sourceMappingURL=resolver.js.map