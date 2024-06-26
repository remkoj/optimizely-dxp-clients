import { CmsIntegrationApiClient } from "./client";
import { getAccessToken } from "./getaccesstoken";
import { type CmsIntegrationApiOptions, getCmsIntegrationApiConfigFromEnvironment } from "./config";
import type { InstanceApiVersionInfo } from "./types";
import type { CancelablePromise } from "./client";
import buildInfo from "./version.json"
import { OpenAPI } from "./client/core/OpenAPI"

export class ApiClient extends CmsIntegrationApiClient
{
    private _config : CmsIntegrationApiOptions

    /**
     * Create a new instance of the API Client
     * 
     * @param   config  The instance configuration
     */
    public constructor (config?: CmsIntegrationApiOptions)
    {
        const options = config ?? getCmsIntegrationApiConfigFromEnvironment()
        options.base = new URL(OpenAPI.BASE, options.base)
        let access_token : string | undefined = undefined
        super({
            BASE: options.base.href, 
            TOKEN: async () => {
                if (!access_token)
                    access_token = await getAccessToken(options).catch(e => {
                        if (options.debug) {
                            console.error(`🔴 [CMS API] Failed to obtain an access token`)
                            console.error(e)
                        }
                        return undefined
                    })
                return access_token ?? ''
            },
            HEADERS: {
                Connection: "Close"
            },
            WITH_CREDENTIALS: true,
            CREDENTIALS: "include"
        })
        this._config = options
    }

    /**
     * The URL of the CMS instance
     */
    public get cmsUrl() : URL
    {
        return this._config.base
    }

    /**
     * Marker to indicate if the client has debugging enabled
     */
    public get debug() : boolean
    {
        return this._config.debug ?? false
    }

    public get version() : string
    {
        return OpenAPI.VERSION
    }

    /**
     * The API version for which this client was build
     */
    public get apiVersion() : string
    {
        return buildInfo.api
    }

    /**
     * The CMS version for which this client was build
     */
    public get cmsVersion() : string
    {
        return buildInfo.cms
    }

    /**
     * Retrieve the version information 
     * 
     * @returns The version information from the running instance
     */
    public getInstanceInfo() : CancelablePromise<InstanceApiVersionInfo>
    {
        return this.request.request({
            method: 'GET',
            url: '/info',
            errors: {
                403: `Forbidden`,
            },
        })
    }

    
}