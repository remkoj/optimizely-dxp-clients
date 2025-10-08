// Import GraphQL Client
import createClient, { type IOptiGraphClient, isOptiGraphClient, OptiCmsSchema } from '../../client/index.js'
import { type OptimizelyGraphConfig } from '../../types.js'

// Import Routing specific types
import type { Route, IRouteResolver } from "./types.js"
import type { ContentLinkWithLocale } from '../types.js'

import type { OptimizelyCmsRoutingApi, OptimizelyCmsRoutingApiClass } from './queries/types.js'


/**
 * Default router implementation for Optimizely CMS
 */
export class RouteResolver implements IRouteResolver {
  private _cgClient: IOptiGraphClient
  private _defaultUrlBase: string | URL
  private _resolverMode: OptiCmsSchema
  private _resolver: OptimizelyCmsRoutingApi | undefined

  protected get client(): IOptiGraphClient {
    return this._cgClient
  }

  protected get urlBase(): string | URL {
    return this._defaultUrlBase
  }

  protected get schema(): OptiCmsSchema {
    return this._resolverMode
  }

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
  public constructor(
    clientOrConfig?: IOptiGraphClient | OptimizelyGraphConfig,
    urlBase: string | URL = "https://example.com",
    resolverMode?: OptiCmsSchema
  ) {
    this._cgClient = isOptiGraphClient(clientOrConfig) ? clientOrConfig : createClient(clientOrConfig)
    this._defaultUrlBase = urlBase
    this._resolverMode = resolverMode ?? this._cgClient.currentOptiCmsSchema
  }

  public enablePreview(changeset?: string): void {
    this.getResolver().then(resolver => {
      if (this._cgClient.debug)
        console.log("⚪ [RouteResolver] Enabling preview mode for changeset:", changeset ?? "default")
      resolver.enablePreview(changeset)
    })
  }

  public disablePreview(): void {
    this.getResolver().then(resolver => {
      if (this._cgClient.debug)
        console.log("⚪ [RouteResolver] Disabling preview mode")
      resolver.disablePreview()
    })
  }

  private async getResolver(): Promise<OptimizelyCmsRoutingApi> {
    if (!this._resolver) {
      let ResolverClass: OptimizelyCmsRoutingApiClass
      if (this._resolverMode == OptiCmsSchema.CMS12) {
        ResolverClass = (await import('./queries/cms12/index.js')).default
      } else {
        ResolverClass = (await import('./queries/cms13/index.js')).default
      }
      this._resolver = new ResolverClass()
    }
    return this._resolver
  }

  /**
   * Retrieve all registered routes for the provided domain - all domains if none specified
   * 
   * @param       domainOrChannelId   The domain to filter on
   * @param       onlyWithDomain      If set/kept to `undefined` will only filter by domain. When
   *                                  set to `true`, requires the domain (CMS SaaS/13 only) to be 
   *                                  set. This allows to get all routes bound to a domain.
   * @param       includeVariants     If set to `true` the output will include all variants for 
   *                                  each item in the CMS.
   * @returns     The list of routes
   */
  public async getRoutes(domain?: string, onlyWithDomain?: boolean, includeVariants?: boolean): Promise<Route[]> {
    return (await this.getResolver()).getRoutes(this._cgClient, domain, onlyWithDomain, includeVariants)
  }

  /**
   * Resolve a path to route information, either from string or from URL
   * object.
   * 
   * @param       path        The path to resolve for
   * @param       domain      The domain to filter the results by
   * @param       variation   The name of the variation to filter the routes by
   * @returns     The route information for the path
   */
  public async getContentInfoByPath(path: URL): Promise<undefined | Route>
  public async getContentInfoByPath(path: string, domain?: string, variation?: string): Promise<undefined | Route>
  public async getContentInfoByPath(path: URL | string, domain?: string, variation?: string): Promise<undefined | Route> {
    const queryPath = typeof path == 'object' && path != null ? path.pathname : path
    const queryDomain = typeof path == 'object' && path != null ? path.protocol + '//' + path.host : domain

    return (await this.getResolver()).getRouteByPath(this._cgClient, queryPath, queryDomain, variation)
  }

  public async getContentInfoById(key: string, locale?: string, version?: string | number): Promise<undefined | Route> {
    return (await this.getResolver()).getRouteById(this._cgClient, key, locale, version)
  }

  /**
   * Extract a content link from a route definition
   * 
   * @param       route   The route to parse
   * @returns     The ContentLink, with locale information
   */
  public routeToContentLink(route: Route): ContentLinkWithLocale {
    return {
      key: route.key,
      version: route.version,
      locale: route.locale,
      isInline: false,
      variation: route.variation,
      changeset: route.changeset
    }
  }
}

export default RouteResolver