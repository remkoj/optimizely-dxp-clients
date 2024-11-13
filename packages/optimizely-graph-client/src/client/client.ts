import { readEnvironmentVariables, applyConfigDefaults, validateConfig, type OptimizelyGraphConfigInternal, type OptimizelyGraphConfig } from "../config.js"
import { GraphQLClient } from "graphql-request"
import { AuthMode, type RequestMethod, type IOptiGraphClient, type OptiGraphSiteInfo, type IOptiGraphClientFlags, type OptiCmsSchema, type FrontendUser } from "./types.js"
import createHmacFetch, { type FetchAPI } from "../hmac-fetch.js"
import { base64encode, isError, validateToken, getAuthMode, isValidFrontendUser } from "./utils.js"

const defaultFlags : IOptiGraphClientFlags = {
    queryCache: true,
    cache: true,
    recursive: false,
    omitEmpty: false,
    cache_uniq: false
}

export class ContentGraphClient extends GraphQLClient implements IOptiGraphClient
{
    public static readonly ForceHmacToken : string = 'use-hmac'
    public static readonly ForceBasicAuth : string = 'use-basic'
    protected readonly _config : Readonly<OptimizelyGraphConfigInternal>
    private _user : FrontendUser | undefined = undefined
    private _token : string | undefined
    private _hmacFetch : FetchAPI | undefined
    private _flags : IOptiGraphClientFlags
    public get currentOptiCmsSchema() : OptiCmsSchema
    {
        return this._config.opti_cms_schema
    }
    public get debug() : boolean 
    {
        return this._config.debug ?? false
    }
    public get frontendUser() : FrontendUser | undefined
    {
        return this._user
    }
    protected get token() : string | undefined
    {
        return this._token
    }
    protected set token(newValue: string | undefined)
    {
        if (!validateToken(newValue))
            throw new Error("❌ [Optimizely Graph] Invalid ContentGraph token")
        const newMode = getAuthMode(newValue)
        if ((newMode == AuthMode.Basic || newMode == AuthMode.HMAC) && !validateConfig(this._config, false)) {
            throw new Error("❌ [Optimizely Graph] Configuration is invalid for selected authentication mode")
        }
        if (this.debug)
            console.log(`🔑 [Optimizely Graph] Updating token to ${ newValue }`) 
        this._token = newValue
    }
    protected get hmacFetch() : FetchAPI
    {
        if (!this._hmacFetch) {
            if (this._config.app_key == undefined || this._config.secret == undefined)
                throw new Error("❌ [Optimizely Graph] Unable to create an authenticated connection, make sure both the AppKey & Secret are configured")
            this._hmacFetch = createHmacFetch(this._config.app_key, this._config.secret)
        }
        return this._hmacFetch
    }

    public get siteInfo() : OptiGraphSiteInfo
    {
        return {
            frontendDomain: this._config.deploy_domain,
            cmsURL: this._config.dxp_url,
            publishToken: this._config.publish
        }
    }

    public get currentAuthMode() : AuthMode
    {
        return this._user ? AuthMode.User : getAuthMode(this._token)
    }

    public constructor(config?: OptimizelyGraphConfig, token: AuthMode | string | undefined = undefined, flags?: Partial<IOptiGraphClientFlags>)
    {
        const configFlags = { ...defaultFlags, ...flags }

        // Validate inputs
        const optiConfig : OptimizelyGraphConfig = applyConfigDefaults(config ?? readEnvironmentVariables())
        if (!validateToken(token))
            throw new Error("❌ [Optimizely Graph] Invalid ContentGraph token")
        const authMode = getAuthMode(token)
        if (!validateConfig(optiConfig, authMode == AuthMode.Public || authMode == AuthMode.Token, true))
            throw new Error("❌ [Optimizely Graph] Invalid ContentGraph configuration")

        // Create instance
        const QUERY_LOG = optiConfig.query_log ?? false
        const serviceUrl = new URL("/content/v2", optiConfig.gateway)
        if (configFlags.queryCache)
            serviceUrl.searchParams.set('stored', 'true')
        super(serviceUrl.href, {
            credentials: "include",
            method: "post",
            requestMiddleware: request => {
                if (QUERY_LOG) {
                    console.log(`🔎 [Optimizely Graph] [Request URL] ${ request.url }\n
🔎 [Optimizely Graph] [Request Headers] ${ JSON.stringify(request.headers) }\n
🔎 [Optimizely Graph] [Request Query] ${ request.body }\n
🔖 [Optimizely Graph] [Request Variables] ${ JSON.stringify(request.variables) }`)
                }
                return request
            },
            responseMiddleware: response => {
                if (isError(response)) {
                    console.error(`❌ [Optimizely Graph] [Error] ${ response.name } => ${ response.message }`)
                } else if (response.errors) {
                    response.errors.forEach(
                        ({ message, locations, path, name, source }) => 
                        {
                            const locationList = (locations ?? []).map(loc => {
                                return `[Line: ${ loc.line }, Column: ${loc.column}]`
                            }).join("; ")
                            const errorName = name && name != 'undefined' ? ` ${ name }` : ""
                            const sourceInfo = source?.body ?? ""
                            const sourceName = source?.name ? ` in ${ source.name }` : ""
                            console.error(`❌ [Optimizely Graph] [GraphQL${ errorName } error${sourceName}]:\n  Message: ${message}\n  Location: ${ locationList }\n  Path: ${path}\n  Query: ${ sourceInfo }`)
                        }
                    );
                } else if (QUERY_LOG) {
                    console.log(`📦 [Optimizely Graph] [Response Data] ${ JSON.stringify(response.data) }`)
                    console.log(`🔖 [Optimizely Graph] [Response Cost] ${ JSON.stringify((response.extensions as { cost?: number } | undefined )?.cost || 0) }`)
                }
            }

        })

        // Set variables
        this._config = optiConfig
        this._token = token
        this._flags = configFlags
        this.updateRequestConfig()
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
    public updateAuthentication(tokenOrAuthmode?: string | AuthMode | undefined) : ContentGraphClient
    {
        if (tokenOrAuthmode == AuthMode.Token)
            throw new Error("❌ [Optimizely Graph] Provide the authentication token to switch to AuthMode.Token");
        if (tokenOrAuthmode == AuthMode.User)
            throw new Error("❌ [Optimizely Graph] User mode authentication automatically activated when setting user information");
        this.token = tokenOrAuthmode == AuthMode.Public ? undefined : tokenOrAuthmode
        this.updateRequestConfig()
        return this
    }

    public query : RequestMethod = (...args) =>
    {
        //@ts-expect-error
        return this.request(...args)
    }

    private _oldFlags : IOptiGraphClientFlags | undefined = undefined

    public updateFlags(newFlags: Partial<IOptiGraphClientFlags>, temporary: boolean = false) : IOptiGraphClient
    {
        // Determine the new flags
        if (this._oldFlags)
            throw new Error("❌ [Optimizely Graph] There's a temporary flag update in progress, revert that one first prior to updating the flags")
        if (temporary)
            this._oldFlags = this._flags
        this._flags = { ...this._flags, ...newFlags }

        if (this.debug)
            console.log(`🔵 [Optimizely Graph] ${ temporary ? 'Temporary updating' : 'Updating'} the feature configuration of the client`)

        // Update the request configuration
        this.updateRequestConfig()
        return this
    }

    public restoreFlags() : IOptiGraphClient
    {
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

    protected updateRequestConfig() : void
    {
        // Build headers that are shared across authentication modes
        const headers : Record<string, string> = {
            "X-Client": "@RemkoJ/OptimizelyGraphClient"
        }
        if (this._flags.recursive)
            headers["cg-recursive-enabled"] = "true"

        // Update headers & fetch method
        switch (this.currentAuthMode) {
            case AuthMode.HMAC:
                this.setHeaders(headers)
                this.requestConfig.cache = 'no-store'
                this.requestConfig.fetch = this.hmacFetch
                break
            case AuthMode.Basic:
                this.setHeaders({
                    ...headers,
                    Authorization: `Basic ${ base64encode(this._config.app_key + ":" + this._config.secret) }`
                })
                this.requestConfig.cache = 'no-store'
                this.requestConfig.fetch = fetch
                break
            case AuthMode.User:
                if (!isValidFrontendUser(this._user))
                    throw new Error('❌ [Optimizely Graph] Invalid frontend user configuration')
                this.setHeaders({
                    ...headers,
                    'cg-username': this._user.username,
                    'cg-roles': this._user.roles
                })
                this.requestConfig.cache = 'no-store'
                this.requestConfig.fetch = this.hmacFetch
                break;
            case AuthMode.Token: 
                this.setHeaders({
                    ...headers,
                    Authorization: `Bearer ${ this.token }`
                })
                this.requestConfig.cache = 'no-store'
                this.requestConfig.fetch = fetch
                break
            default:
                this.setHeaders({
                    ...headers,
                    Authorization: `epi-single ${ this._config.single_key }`
                })
                this.requestConfig.fetch = fetch
                break
        }

        this.requestConfig.keepalive = false
        this.requestConfig.credentials = 'omit'
        if (!this._flags.cache) {
            this.requestConfig.cache = 'no-store'
        }

        // Build endpoint
        const serviceUrl = new URL("/content/v2", this._config.gateway)
        if (typeof(this._config.tenant_id) == 'string' && this._config.tenant_id.length > 0)
            serviceUrl.pathname = serviceUrl.pathname + '/tenant_id=' + this._config.tenant_id
        serviceUrl.searchParams.set('stored', this._flags.queryCache ? 'true' : 'false')
        serviceUrl.searchParams.set('cache', this._flags.cache ? 'true' : 'false')
        serviceUrl.searchParams.set('omit_empty', this._flags.omitEmpty ? 'true' : 'false')
        serviceUrl.searchParams.set('authMode', this.currentAuthMode)
        if (this._flags.cache_uniq)
            serviceUrl.searchParams.set('unique', 'true')
        if (this.debug)
            console.log(`🔗 [Optimizely Graph] Setting service endpoint to: ${ serviceUrl.href }`)
        this.setEndpoint(serviceUrl.href)
    }
}

export default ContentGraphClient