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
   * Enable preview mode for the RouteResolver, when enabled this will add a filter to the
   * methods of this instance that allows selecting the appropriate version of the content
   * item.
   * 
   * ***Warning***: Enabling previews, without a GraphQL client that has authentication in place
   * will cause missing routes in the results
   * 
   * @param   changeset   The changeset to use, if omitted the it will use the published version
   *                      or main draft of each content item.
   */
  enablePreview(changeset?: string): void

  /**
   * Disable preview mode for the RouteResolver
   */
  disablePreview(): void

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

  /**
   * Get the routing info for a specific content item
   * 
   * @param   key       The key of the content item
   * @param   locale    The locale to use
   * @param   version   The version of the content item
   * @returns The Route information, if the `key`, `version`, `locale` combination 
   *          yields a valid item
   */
  getContentInfoById(key: string, locale?: string, version?: string | number): Promise<undefined | Route>
}