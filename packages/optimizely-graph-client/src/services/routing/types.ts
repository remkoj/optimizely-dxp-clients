import type { ContentLinkWithLocale } from '../types.js'

export type Route = {
  locale: string
  path: string
  url: URL
  slug: string
  changed: Date | null
  contentType: string[]
  version?: string | null
  key: string
}

/**
 * Main Router pattern, allow for implementation specific overrides
 */
export interface IRouteResolver {

  /**
   * Retrieve all registered routes for the provided domain - all domains if none specified
   * 
   * @param       domainOrChannelId   The domain to filter on
   * @param       onlyWithDomain      If set/kept to `undefined` will only filter by domain. When
   *                                  set to `true`, requires the domain (CMS SaaS/13 only) to be 
   *                                  set. This allows to get all routes bound to a domain.
   * @returns     The list of routes
   */
  getRoutes(domainOrChannelId?: string, onlyWithDomain?: boolean): Promise<Route[]>

  /**
   * Resolve a path to route information, either from string or from URL
   * object.
   * 
   * @param       path        The path to resolve for
   * @param       domain      The domain to filter the results by
   * @returns     The route information for the path
   */
  getContentInfoByPath(path: URL): Promise<undefined | Route>
  getContentInfoByPath(path: string, domain?: string): Promise<undefined | Route>
  getContentInfoByPath(path: URL | string, domain?: string): Promise<undefined | Route>

  /**
   * Extract a content link from a route definition
   * 
   * @param       route   The route to parse
   * @returns     The ContentLink, with locale information
   */
  routeToContentLink(route: Route): ContentLinkWithLocale

  getContentInfoById(key: string, locale?: string, version?: string | number): Promise<undefined | Route>
}