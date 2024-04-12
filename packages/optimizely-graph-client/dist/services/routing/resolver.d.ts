import { type IOptiGraphClient } from '../../client/index.js';
import type { OptimizelyGraphConfig } from '../../types.js';
import type { Route } from "./types.js";
import type { ContentLinkWithLocale } from '../types.js';
import * as GetAllRoutes from './queries/getAllRoutes.js';
/**
 *
 */
export declare class RouteResolver {
    private _cgClient;
    /**
     * Create a new Route Resolver
     *
     * @param client        ContentGraph configuration override
     * @param apolloConfig  Apollo Client configuration override
     */
    constructor(clientOrConfig?: IOptiGraphClient | OptimizelyGraphConfig);
    /**
     * Retrieve all registered routes for the provided domain - all domains if none specified
     *
     * @param       domain      The domain to filter on
     * @returns     The list of routes
     */
    getRoutes(domain?: string): Promise<Route[]>;
    /**
     * Retrieve route details by path
     *
     * @param       path
     * @param       domain
     * @returns     The route information for the path
     */
    getContentInfoByPath(path: string, domain?: string): Promise<undefined | Route>;
    getContentInfoById(key: string, locale?: string, version?: string | number): Promise<undefined | Route>;
    /**
     * Extract a content link from a route definition
     *
     * @param       route   The route to parse
     * @returns     The ContentLink, with locale information
     */
    routeToContentLink(route: Route): ContentLinkWithLocale;
    protected convertResponse(item: GetAllRoutes.Route): Route;
    protected tryConvertResponse(item: GetAllRoutes.Route): Route | undefined;
    protected isNotNullOrUndefined<T>(input: T | null | undefined): input is T;
}
export default RouteResolver;
