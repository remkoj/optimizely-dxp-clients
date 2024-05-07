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
    private _defaultUrlBase;
    /**
     * Create a new Route Resolver
     *
     * @param clientOrConfig    The Optimizely Graph client or configuration to
     *                          use. If omitted, the paramterless factory method
     *                          used to create a new instance.
     * @param urlBase           The value for the base parameter of the URL
     *                          constructor when reading routes from Optimizely
     *                          Graph
     */
    constructor(clientOrConfig?: IOptiGraphClient | OptimizelyGraphConfig, urlBase?: string | URL);
    /**
     * Retrieve all registered routes for the provided domain - all domains if none specified
     *
     * @param       domain      The domain to filter on
     * @returns     The list of routes
     */
    getRoutes(domain?: string): Promise<Route[]>;
    /**
     * Resolve a path to route information, either from string or from URL
     * object.
     *
     * @param       path        The path to resolve for
     * @param       domain      The domain to filter the results by
     * @returns     The route information for the path
     */
    getContentInfoByPath(path: URL): Promise<undefined | Route>;
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
