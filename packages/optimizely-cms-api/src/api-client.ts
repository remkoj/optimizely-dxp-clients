import { CmsIntegrationApiClient } from "./client";
import { getAccessToken } from "./getaccesstoken";
import { type CmsIntegrationApiOptions, getCmsIntegrationApiConfigFromEnvironment } from "./config";
import { type InstanceApiVersionInfo, OptiCmsVersion } from "./types";
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
        let base = options.base.toString();
        let version = OpenAPI.VERSION;
        if (options.cmsVersion == OptiCmsVersion.CMS12) {
          version = 'preview1';
          if (options.debug)
            console.info(`🚧 CMS 12 compatibility mode. Base URL ${base}, version: ${ version }`);
        } else if (options.debug) {
          console.info(`🚀 CMS 13 mode. Base URL ${base}, version: ${ version }`);
        }
        let access_token : string | undefined = undefined
        super({
            BASE: base,
            VERSION: version,
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
     * Get the runtime configuration of the target CMS version. 
     * 
     * If this differs from the cmsVersion the client may not work fully or not
     * at all.
     */
    public get runtimeCmsVersion() : OptiCmsVersion
    {
        return this._config.cmsVersion ?? OptiCmsVersion.CMS13
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
        return this._config.cmsVersion == OptiCmsVersion.CMS12 ? 'preview1' : OpenAPI.VERSION
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
