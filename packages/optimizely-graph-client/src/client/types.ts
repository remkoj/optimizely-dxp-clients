import type { GraphQLClient, RequestMiddleware } from "graphql-request"
import type { OptimizelyGraphConfig } from "../types.js"

export type ClientInstanceType = InstanceType<typeof GraphQLClient>
export type RequestMethod = InstanceType<typeof GraphQLClient>['request']
export type { RequestMiddleware, Variables } from "graphql-request"

export type QueryParams = {
  query: Parameters<RequestMethod>[0]['document']
  variables: Parameters<RequestMethod>[0]['variables']
}

/**
 * Frontend authentication data
 */
export type FrontendUser = {
  /**
   * The username of the authenticated frontend user
   */
  username: string

  /**
   * The role(s) of the authenticated frontend user, as a comma separated
   * list, no whitespaces around the values
   */
  roles: string
}

/**
 * The supported content schema's by Optimizely Graph
 */
export enum SchemaVersion {
  /**
   * This is the default (current) schema of Optimizely Graph.
   */
  Default = "current",
  /**
   * This is a future schema, which has been staged to to be released in the
   * future.
   */
  Next = "new"
}

export enum OptiCmsSchema {
  CMS12 = "OPTI-CMS-12",
  CMS13 = "OPTI-CMS-13"
}

export enum AuthMode {
  Public = "epi-single",
  Basic = "use-basic",
  HMAC = "use-hmac",
  Token = "use-token",
  User = "use-user"
}

export type OptiGraphSiteInfo = {
  frontendDomain?: string,
  cmsURL?: string
  publishToken?: string
}

export type IOptiGraphClientFlags = {
  /**
   * Control support for caching the execution plan for a query, this ensures
   * that the execution plan does not need to be rebuild after publishing content.
   * 
   * The following features do not work with query caching enabled:
   * - `@recursive`
   * - cursors
   * 
   * @see https://docs.developers.optimizely.com/platform-optimizely/v1.4.0-optimizely-graph/docs/cached-templates
   */
  queryCache: boolean

  /**
   * Control support for the recursive directive within Optimizely Graph
   * 
   * @deprecated  This feature is no longer controlled by flags
   * @see https://docs.developers.optimizely.com/platform-optimizely/v1.4.0-optimizely-graph/docs/recursive-directive-usage
   */
  recursive: boolean

  /**
   * Cache the output of a query on the CDN edge, so subsequent requests for the
   * same data will be handled completely at the CDN edge.
   */
  cache: boolean

  /**
   * When set to true, empty object will be omitted from the result
   */
  omitEmpty: boolean

  /**
   * **Warning:** Experimental feature, only enable when instructed to do so by 
   * Optimizely Support
   * 
   * When enabled, the service will use another cache strategy, and create a
   * cache-tag for the query using format {tentantId}_{ReturnedContentId}, 
   * when "unique" parameter is being used. The normal cache-tag is {tenantId}
   *
   * Our purge cache (cache invalidation) functionality will do purge cache 
   * for both the tags {tenantId} and {tentantId}_UpdatedContentId} when a 
   * content is created/updated/deleted
   *
   * So in practise: this will keep result cache for a query - until the specific 
   * content has been updated / deleted
   * 
   * @deprecated  Use `item` instead of `items` in your query
   * @see https://docs.developers.optimizely.com/platform-optimizely/v1.4.0-optimizely-graph/docs/item-queries
   */
  cache_uniq: boolean

  /**
   * **Warning:** Experimental feature
   * 
   * When enabled, the request will be updated with Next.JS specific fetch parameters
   * to control the Next.JS data cache. When enabled, the following directives are set:
   * - Cache
   * - Next.Revalidate
   * - Next.Tags
   * 
   * The following tags are used: 
   * - opti-graph: On all requests
   * - opti-graph-public: On all requests using single-key authentication
   * - opti-graph-private: On all requests using one of the other authentication methods
   * - opti-graph-operation-[operationName]: On all requests that have an operationName set
   */
  nextJsFetchDirectives: boolean

  /**
   * Enable querying for deleted documents. This does require an authenticated connections,
   * so make sure to also switch to HMAC authentication when enabling this for the results
   * to be as expected.
   * 
   * @see https://docs.developers.optimizely.com/platform-optimizely/v1.4.0-optimizely-graph/docs/modified-and-deleted-documents#deleted-documents
   */
  includeDeleted: boolean
}

export interface IOptiGraphClient extends ClientInstanceType {
  /**
   * Retrieve the debug indicator, as configured for this client
   */
  readonly debug: boolean

  /**
   * Retrieve basic information about the configured frontend
   */
  readonly siteInfo: OptiGraphSiteInfo

  /**
   * Retrieve the current authentication mode
   */
  readonly currentAuthMode: AuthMode

  /**
   * Retrieve the currently active CMS Schema. This doesn't affect the client
   * itself, however it can be used by users of this client to determine which
   * query format must be used.
   */
  readonly currentOptiCmsSchema: OptiCmsSchema

  /**
   * Retrieve the currently used frontend user information - if any
   */
  readonly frontendUser: FrontendUser | undefined

  /**
   * Retrieve the graph schema version used by this client
   */
  readonly graphSchemaVersion: SchemaVersion

  /**
   * Update the authentication data for this client. 
   * - Set to AuthMode.HMAC or AuthMode.Basic to use that authentication 
   *   scheme, this requires the AppKey and Secret to be part of the 
   *   configuration
   * - Set to the actual token to be used to switch to AuthMode.Token
   * - Set to undefined or AuthMode.Public to switch to public, read-only 
   *   mode. (i.e. using the SingleKey)
   * 
   * @param       tokenOrAuthmode     The authentication mode/token to be used
   * @returns     The client itself
   */
  updateAuthentication(tokenOrAuthmode?: string | AuthMode | undefined): IOptiGraphClient

  /**
   * Convenience method, for those who are more used to the API of ApolloClient
   * 
   * @deprecated  Use the "request" method instead
   */
  query: RequestMethod

  /**
   * Set the client controllable service configuration
   * 
   * @param   newFlags        The configuration values to override.
   * @param   temporary       Set to true to store the old configuration, 
   *                          please note that you cannot invoke this method
   *                          again untill the configuration has been 
   *                          restored first.
   * @returns Itself, so you chain it in a request
   */
  updateFlags(newFlags: Partial<IOptiGraphClientFlags>, temporary?: boolean): IOptiGraphClient

  /**
   * Restore client controllable service configuration, after it has been 
   * saved by a temporary update. If there's nothing to restore this method 
   * will do nothing
   * 
   * @returns Itself, so you chain it in a request
   */
  restoreFlags(): IOptiGraphClient

  /**
   * Apply the frontend user configuration that must be used for this client
   * 
   * @param       newUser     The Frontend User to apply to the requests of
   *                          this client instance. Provide the value `null`
   *                          to remove the current user information.
   * @returns     Whether or not the FrontendUser was applied correctly to 
   *              the client configuration
   */
  setFrontendUser(newUser: FrontendUser | null): boolean

  /**
   * Get the configuration that can be used to construct a similar client
   * at the other side of the React boundary. The config only contains the
   * part that is safe to cross.
   * 
   * @param key The key for which this serialization to JSON occurs
   */
  toJSON(key?: string): OptimizelyGraphConfig

  /**
   * 
   * @param additionalMiddleware 
   * @returns 
   */
  setRequestMiddleware: (additionalMiddleware: RequestMiddleware) => IOptiGraphClient
}

// Factory service
export type ClientFactory = (token?: string) => IOptiGraphClient