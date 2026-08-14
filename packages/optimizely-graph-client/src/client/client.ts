import { readEnvironmentVariables, applyConfigDefaults, validateConfig, type OptimizelyGraphConfigInternal, type OptimizelyGraphConfig } from "../config.js"
import { type ClientError, GraphQLClient, type RequestMiddleware, type Variables, type ResponseMiddleware } from "graphql-request"
import { AuthMode, type RequestMethod, type IOptiGraphClient, type OptiGraphSiteInfo, type IOptiGraphClientFlags, type OptiCmsSchema, type FrontendUser, SchemaVersion } from "./types.js"
import createHmacFetch, { type FetchAPI } from "../hmac-fetch.js"
import { base64encode, isError, validateToken, getAuthMode, isValidFrontendUser } from "./utils.js"
import versionInfo from '../version.js'

type RequestExtendedInit<V extends Variables = Variables> = Parameters<RequestMiddleware<V>>[0] & {
  next?: {
    revalidate?: false | 0 | number
    cache?: 'force-cache' | 'no-store'
    tags?: string[]
  }
}

const defaultFlags: IOptiGraphClientFlags = {
  cache: true,
  queryCache: false,
  recursive: false,
  omitEmpty: false,
  cache_uniq: false,
  nextJsFetchDirectives: false,
  includeDeleted: false
}

export class ContentGraphClient extends GraphQLClient implements IOptiGraphClient {
  public static readonly ForceHmacToken: string = AuthMode.HMAC
  public static readonly ForceBasicAuth: string = AuthMode.Basic
  protected readonly _config: Readonly<OptimizelyGraphConfigInternal>
  private _user: FrontendUser | undefined = undefined
  private _token: string | undefined
  private _hmacFetch: FetchAPI | undefined
  private _flags: IOptiGraphClientFlags
  private _customMiddleware: RequestMiddleware<Variables> | undefined
  private _variableToTags: Map<string,(variableValue?:unknown) => string>
  public get currentOptiCmsSchema(): OptiCmsSchema {
    return this._config.opti_cms_schema
  }
  public get debug(): boolean {
    return this._config.debug ?? false
  }
  public get frontendUser(): FrontendUser | undefined {
    return this._user
  }
  protected get token(): string | undefined {
    return this._token
  }
  protected set token(newValue: string | undefined) {
    if (!validateToken(newValue))
      throw new Error("❌ [Optimizely Graph] Invalid ContentGraph token")
    const newMode = getAuthMode(newValue)
    if ((newMode == AuthMode.Basic || newMode == AuthMode.HMAC) && !validateConfig(this._config, false)) {
      throw new Error("❌ [Optimizely Graph] Configuration is invalid for selected authentication mode")
    }
    if (this.debug)
      console.log(`🔑 [Optimizely Graph] Updating token to ${newValue}`)
    this._token = newValue
  }
  protected get hmacFetch(): FetchAPI {
    if (!this._hmacFetch) {
      if (this._config.app_key == undefined || this._config.secret == undefined)
        throw new Error("❌ [Optimizely Graph] Unable to create an authenticated connection, make sure both the AppKey & Secret are configured")
      this._hmacFetch = createHmacFetch(this._config.app_key, this._config.secret)
    }
    return this._hmacFetch
  }

  public get siteInfo(): OptiGraphSiteInfo {
    return {
      frontendDomain: this._config.deploy_domain,
      cmsURL: this._config.dxp_url,
      publishToken: this._config.publish
    }
  }

  public get currentAuthMode(): AuthMode {
    return this._user ? AuthMode.User : getAuthMode(this._token)
  }

  public get graphSchemaVersion(): SchemaVersion {
    return this._config.graph_schema || SchemaVersion.Default
  }

  public constructor(config?: OptimizelyGraphConfig, token: AuthMode | string | undefined = undefined, flags?: Partial<IOptiGraphClientFlags>) {
    const configFlags = { ...defaultFlags, ...flags }

    // Validate inputs
    const optiConfig: OptimizelyGraphConfig = applyConfigDefaults(config ?? readEnvironmentVariables())
    if (!validateToken(token))
      throw new Error("❌ [Optimizely Graph] Invalid ContentGraph token")
    const authMode = getAuthMode(token)
    if (!validateConfig(optiConfig, authMode == AuthMode.Public || authMode == AuthMode.Token, true))
      throw new Error("❌ [Optimizely Graph] Invalid ContentGraph configuration")

    // Create instance
    const serviceUrl = new URL("/content/v2", optiConfig.gateway)
    super(serviceUrl.href, {
      method: "post",
      keepalive: false,
      credentials: "include",
      redirect: "manual",
      requestMiddleware: (request) => this._requestMiddleware(request),
      responseMiddleware: (response) => this._responseMiddleware(response)
    });

    // Create initial map
    this._variableToTags = new Map();
    this._variableToTags.set('key', (currentKey: unknown) => `key-${ currentKey }`)
    this._variableToTags.set('domain', (currentKey: unknown) => `channel-${ currentKey }`)
    this._variableToTags.set('channel', (currentKey: unknown) => `channel-${ currentKey }`)
    this._variableToTags.set('channelId', (currentKey: unknown) => `channel-${ currentKey }`)

    // Set variables
    this._config = optiConfig
    this._token = token
    this._flags = configFlags

    // Update config
    this.updateRequestConfig()
  }

  private async _requestMiddleware<V extends Variables = Variables>(request: RequestExtendedInit<V>)
  {
    const QUERY_LOG = this._config.query_log ?? false
    if (this.currentAuthMode == AuthMode.Public && this._flags.nextJsFetchDirectives && request.operationName) {
      if (!Array.isArray(request.next?.tags)) {
        if (!request.next)
          request.next = {};
        request.next.tags = []
      }
      request.next.tags = request.next.tags.filter(x => 
        !x.startsWith('opti-graph-operation-') &&
        !x.startsWith('opti-graph-variable-')
      )
      request.next.tags.push('opti-graph-operation-' + request.operationName)
      if (request.variables && typeof(request.variables) === 'object') {
        Object.getOwnPropertyNames(request.variables).forEach((propName) => {
          const transform = this._variableToTags.get(propName);
          if (transform)
            request.next?.tags?.push('opti-graph-variable-'+transform((request.variables as Record<string,unknown>)[propName]))
        });
      }
    }
    if (this._customMiddleware)
      request = await this._customMiddleware(request) as RequestExtendedInit<V>

    if (QUERY_LOG) {
      console.log(`🔎 [Optimizely Graph] [Request URL] ${request.url} [${request.cache}]\n
  🔎 [Optimizely Graph] [Request Headers] ${JSON.stringify(request.headers)}\n
  🔎 [Optimizely Graph] [Request Query] ${getQueryOrRawBody(request)}\n
  🔖 [Optimizely Graph] [Request Variables] ${JSON.stringify(request.variables,undefined,2)}`)
      if (this._flags.nextJsFetchDirectives)
        console.log(`🔖 [Optimizely Graph] [Request Next.JS] ${JSON.stringify(request.next)}`)
    }
    return request
  }

  private _responseMiddleware(response: Parameters<ResponseMiddleware>[0]) {
    const QUERY_LOG = this._config.query_log ?? false
    if (isError(response)) {
      console.error(`❌ [Optimizely Graph] [Error] ${response.name} => ${response.message}`, (response as ClientError).response, (response as ClientError).request)
    } else if (response.errors) {
      response.errors.forEach(
        ({ message, locations, path, name, source }) => {
          const locationList = (locations ?? []).map(loc => {
            return `[Line: ${loc.line}, Column: ${loc.column}]`
          }).join("; ")
          const errorName = name && name != 'undefined' ? ` ${name}` : ""
          const sourceInfo = source?.body ?? ""
          const sourceName = source?.name ? ` in ${source.name}` : ""
          console.error(`❌ [Optimizely Graph] [GraphQL${errorName} error${sourceName}]:\n  Message: ${message}\n  Location: ${locationList}\n  Path: ${path}\n  Query: ${sourceInfo}`)
        }
      );
      throw new Error("[Optimizely Graph] Error received from Optimizely Graph, see console for details")
    } else if (QUERY_LOG) {
      console.log(`📦 [Optimizely Graph] [Response Data] ${JSON.stringify(response.data)}`)
      console.log(`🔖 [Optimizely Graph] [Response Cost] ${JSON.stringify((response.extensions as { cost?: number } | undefined)?.cost || 0)}`)
    }
  }

  /**
   * Update the authentication data for this client. 
   * - Set to AuthMode.HMAC or AuthMode.Basic to use that authentication scheme, this requires the AppKey and Secret to be part of the configuration
   * - Set to the actual token to be used to switch to AuthMode.Token
   * - Set to undefined or AuthMode.Public to switch to public, read-only mode. (i.e. using the SingleKey)
   * 
   * @param       tokenOrAuthmode     The authentication mode/token to be used
   * @returns     The client itself
   */
  public updateAuthentication(tokenOrAuthmode?: string | AuthMode | undefined): ContentGraphClient {
    if (tokenOrAuthmode == AuthMode.Token)
      throw new Error("❌ [Optimizely Graph] Provide the authentication token to switch to AuthMode.Token");
    if (tokenOrAuthmode == AuthMode.User)
      throw new Error("❌ [Optimizely Graph] User mode authentication automatically activated when setting user information");
    this.token = tokenOrAuthmode == AuthMode.Public ? undefined : tokenOrAuthmode
    this.updateRequestConfig()
    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toJSON(key?: string): OptimizelyGraphConfig {
    return {
      single_key: this._config.single_key,
      opti_cms_schema: this._config.opti_cms_schema,
      gateway: this._config.gateway,
      query_log: this._config.query_log,
      debug: this._config.debug,
      graph_schema: this._config.graph_schema
    }
  }

  public setRequestMiddleware(additionalMiddleware: RequestMiddleware): ContentGraphClient {
    this._customMiddleware = additionalMiddleware
    return this
  }

  /**
   * 
   * @deprecated  Use `request` instead
   * @param args 
   * @returns 
   */
  public query: RequestMethod = (...args) => {
    //@ts-expect-error Overload mapping fails
    return this.request(...args)
  }

  private _oldFlags: IOptiGraphClientFlags | undefined = undefined

  public updateFlags(newFlags: Partial<IOptiGraphClientFlags>, temporary: boolean = false): IOptiGraphClient {
    // Determine the new flags
    if (this._oldFlags)
      throw new Error("❌ [Optimizely Graph] There's a temporary flag update in progress, revert that one first prior to updating the flags")
    if (temporary)
      this._oldFlags = this._flags
    this._flags = { ...this._flags, ...newFlags }

    if (this.debug)
      console.log(`🔵 [Optimizely Graph] ${temporary ? 'Temporary updating' : 'Updating'} the feature configuration of the client`)

    // Update the request configuration
    this.updateRequestConfig()
    return this
  }

  public restoreFlags(): IOptiGraphClient {
    // Restore the flags
    if (!this._oldFlags)
      return this
    this._flags = this._oldFlags
    this._oldFlags = undefined

    if (this.debug)
      console.log(`🔵 [Optimizely Graph] Rolling back the feature configuration of the client`)

    // Update the request configuration
    this.updateRequestConfig()
    return this
  }

  public setFrontendUser(newUser: FrontendUser | null): boolean {
    if (!(this._config.app_key && this._config.secret)) {
      return false
    }
    if (!isValidFrontendUser(newUser))
      return false
    this._user = newUser ?? undefined
    this.updateRequestConfig()
    return true
  }

  protected updateRequestConfig(): void {
    const headers = this.buildDefaultHeaders()

    // Update headers & fetch method
    switch (this.currentAuthMode) {
      case AuthMode.HMAC:
        this.requestConfig.fetch = this.hmacFetch
        break
      case AuthMode.Basic:
        headers["Authorization"] = `Basic ${base64encode(this._config.app_key + ":" + this._config.secret)}`
        this.requestConfig.fetch = fetch
        break
      case AuthMode.User:
        if (!isValidFrontendUser(this._user))
          throw new Error('❌ [Optimizely Graph] Invalid frontend user configuration')
        headers['cg-username'] = this._user.username
        headers['cg-roles'] = this._user.roles
        this.requestConfig.fetch = this.hmacFetch
        break;
      case AuthMode.Token:
        headers['Authorization'] = `Bearer ${this.token}`
        this.requestConfig.fetch = fetch
        break
      default:
        headers['Authorization'] = `epi-single ${this._config.single_key}`
        this.requestConfig.fetch = fetch
        break
    }

    // Update fetch configuration
    this.requestConfig.cache = this.cacheEnabled ? undefined : "no-store"

    // Apply Next.JS Fetch directives
    if (this._flags.nextJsFetchDirectives) {
      const tags: string[] = ['opti-graph', this.currentAuthMode == AuthMode.Public ? 'opti-graph-public' : 'opti-graph-private'];
      const nextRequestConfig: {} & RequestExtendedInit['next'] = { tags };
      if (this.cacheEnabled && (this.requestConfig as RequestExtendedInit).next?.revalidate == undefined) {
        nextRequestConfig.revalidate = false
      }
      (this.requestConfig as RequestExtendedInit).next = {
        ...(this.requestConfig as RequestExtendedInit).next,
        ...nextRequestConfig
      };
    }

    this.setHeaders(headers)
    if (this.debug)
      console.log(`🔗 [Optimizely Graph] Updated service endpoint headers: ${JSON.stringify(headers)}`)
    this.setEndpoint(this.buildUrlWithFlags())
  }


  /**
   * Build headers that are shared across authentication modes, taking
   * the current feature flags and authentication into consideration.
   * 
   * @returns The default header set
   */
  protected buildDefaultHeaders(): Record<string, string> {
    // Default headers
    const headers: Record<string, string> = {
      "X-Client": "@RemkoJ/OptimizelyGraphClient",
      "X-Client-Version": versionInfo.version
    }

    // Add feature flag based headers
    if (this.graphSchemaVersion == SchemaVersion.Next)
      headers["cg-query-new"] = "true"
    if (this._flags.includeDeleted)
      headers["cg-include-deleted"] = "true"
    if (this._flags.recursive)
      headers["cg-recursive-enabled"] = "true"

    // Tell the Optimizely Graph service to not cache the request
    headers["Cache-Control"] = "no-store";
    headers["Pragma"] = "no-cache";
    return headers
  }

  protected buildUrlWithFlags() {
    if (this.debug) {
      console.log(`🔗 [Optimizely Graph] Current flags: ${JSON.stringify(this._flags)}`)
      console.log(`🔗 [Optimizely Graph] Cache enabled: ${JSON.stringify(this.cacheEnabled)}`)
    }

    const serviceUrl = new URL("/content/v2", this._config.gateway)
    if (typeof (this._config.tenant_id) == 'string' && this._config.tenant_id.length > 0)
      serviceUrl.pathname = serviceUrl.pathname + '/tenant_id=' + this._config.tenant_id
    serviceUrl.searchParams.set('stored', this._flags.queryCache ? 'true' : 'false')
    serviceUrl.searchParams.set('cache', this.cacheEnabled ? 'true' : 'false')
    serviceUrl.searchParams.set('omit_empty', this._flags.omitEmpty ? 'true' : 'false')
    serviceUrl.searchParams.set('authMode', this.currentAuthMode)
    serviceUrl.searchParams.set('unique', this._flags.cache_uniq ? 'true' : 'false')
    if (this.isPreviewEnabled())
      serviceUrl.searchParams.set('changeset', this.getChangeset() ?? '')
    if (this.debug)
      console.log(`🔗 [Optimizely Graph] Setting service endpoint to: ${serviceUrl.href}`)

    return serviceUrl.href
  }

  /**
   * Check on the cache, to ensure it's only reported as enabled if the client
   * is in "public access" mode.
   * 
   * @returns The cache status
   */
  protected get cacheEnabled(): boolean {
    return this._flags.cache && this.currentAuthMode == AuthMode.Public
  }

  private _changeset: string | null = null
  public enablePreview(changeset: string = "default"): IOptiGraphClient {
    this._changeset = changeset;
    this.updateRequestConfig();
    return this;
  }
  public disablePreview(): IOptiGraphClient {
    this._changeset = null;
    this.updateRequestConfig();
    return this;
  }
  public isPreviewEnabled(): boolean {
    return typeof (this._changeset) == 'string'
  }
  public getChangeset(): string | null {
    return this._changeset
  }


  isDevelopment() {
    try {
      return process?.env?.NODE_ENV === 'development'
    } catch {
      return false
    }
  }

  isDebug() {
    return this._config.debug ?? false
  }

  isDebugOrDevelopment() {
    return this.isDebug() || this.isDevelopment()
  }
}

function getQueryOrRawBody(req: RequestExtendedInit)
{
  if (typeof(req.body) === 'string' && req.body.length > 0) {
    try {
      const bodyData = JSON.parse(req.body);
      return bodyData.query ?? req.body;
    } catch {
      return req.body;
    }
  }
  return req.body;
}

export default ContentGraphClient
