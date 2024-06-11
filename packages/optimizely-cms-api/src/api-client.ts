import { CmsIntegrationApiClient } from "./client";
import { getAccessToken } from "./getaccesstoken";
import { type CmsIntegrationApiOptions, getCmsIntegrationApiConfigFromEnvironment } from "./config";
import type { InstanceApiVersionInfo } from "./types";
import type { CancelablePromise } from "./client";
import buildInfo from "./version.json"

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
        super({
            BASE: options.base.href, 
            TOKEN: () => getAccessToken(options),
            HEADERS: {
                Connection: "Close"
            }
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