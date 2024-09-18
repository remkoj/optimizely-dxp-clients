// Import GraphQL Client
import createClient, { type IOptiGraphClient, isOptiGraphClient } from '../../client/index.js'
import { type OptimizelyGraphConfig, OptiCmsSchema } from '../../types.js'

// Import Routing specific types
import type { Route } from "./types.js"
import type { ContentLinkWithLocale } from '../types.js'

import type { OptimizelyCmsRoutingApi } from './queries/types.js'


// Main router class
/**
 * 
 */
export class RouteResolver {
    private _cgClient : IOptiGraphClient
    private _defaultUrlBase : string | URL
    private _resolverMode : OptiCmsSchema
    private _resolver : OptimizelyCmsRoutingApi | undefined

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
    public constructor (
        clientOrConfig?: IOptiGraphClient | OptimizelyGraphConfig, 
        urlBase: string | URL = "https://example.com",
        resolverMode?: OptiCmsSchema
    ) {
        this._cgClient = isOptiGraphClient(clientOrConfig) ? clientOrConfig : createClient(clientOrConfig)
        this._defaultUrlBase = urlBase
        this._resolverMode = resolverMode ?? this._cgClient.currentOptiCmsSchema
    }

    private async getResolver() : Promise<OptimizelyCmsRoutingApi> 
    {
        if (!this._resolver) {
            if (this._resolverMode == OptiCmsSchema.CMS12)
                return new (await import('./queries/cms12/index.js')).default
            this._resolver = new (await import('./queries/cms13/index.js')).default
        }
        return this._resolver
    }

    /**
     * Retrieve all registered routes for the provided domain - all domains if none specified
     * 
     * @param       domain      The domain to filter on
     * @returns     The list of routes
     */
    public async getRoutes(domain?: string) : Promise<Route[]>
    {
        return (await this.getResolver()).getRoutes(this._cgClient, domain)
    }

    /**
     * Resolve a path to route information, either from string or from URL
     * object.
     * 
     * @param       path        The path to resolve for
     * @param       domain      The domain to filter the results by
     * @returns     The route information for the path
     */
    public async getContentInfoByPath(path: URL) : Promise<undefined | Route>
    public async getContentInfoByPath(path: string, domain?: string) : Promise<undefined | Route>
    public async getContentInfoByPath(path: URL | string, domain?: string) : Promise<undefined | Route>
    {
        const queryPath   = typeof path == 'object' && path != null ? path.pathname : path
        const queryDomain = typeof path == 'object' && path != null ? path.protocol + '//' + path.host : domain

        return (await this.getResolver()).getRouteByPath(this._cgClient, queryPath, queryDomain)
    }

    public async getContentInfoById(key: string, locale?: string, version?: string | number) : Promise<undefined | Route>
    {
        return (await this.getResolver()).getRouteById(this._cgClient, key,locale,version)
    }

    /**
     * Extract a content link from a route definition
     * 
     * @param       route   The route to parse
     * @returns     The ContentLink, with locale information
     */
    public routeToContentLink(route: Route) : ContentLinkWithLocale
    {
        return {
            key: route.key,
            version: route.version,
            locale: route.locale
        }
    }
}

export default RouteResolver