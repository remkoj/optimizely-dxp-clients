import { withOperations, ApiClient as AbstractApiClient, ApiError } from "@remkoj/hey-api-wrapper";
import * as Operations from './client/sdk.gen';
import { createClient, createConfig } from './client/client';
import { createClientConfig } from './client-config';
import { DEFAULT_API_BASEURL, type CmsIntegrationApiOptions, readEnvConfig } from "./config";
import buildInfo from "./version.json";
import type { OpenAPIV3_1 } from "openapi-types";

/**
 * Base implementation of the ApiClient wrapper for the Optimizely CMS Rest API
 */
class BaseApiClient extends AbstractApiClient<CmsIntegrationApiOptions, ReturnType<typeof createClient>> {
  public constructor(config?: CmsIntegrationApiOptions) {
    const apiConfig = config ?? readEnvConfig();
    const apiClient = createClient(createClientConfig(createConfig({
      baseUrl: DEFAULT_API_BASEURL.href,
    }), config));
    super(apiConfig, apiClient);
  }

  /**
   * The URL of the CMS instance
   */
  public get cmsUrl(): URL | undefined {
    if (this._config.base)
      return this._config.base
    const baseUrl = this._client.getConfig().baseUrl
    return baseUrl ? new URL(baseUrl) : undefined
  }

  /**
   * Detect the API Version from the URL, returning the runtime version. When
   * this version differs from the `apiVersion` property errors can be expected.
   */
  public get version(): string {
    const baseUrl = this._client.getConfig().baseUrl
    const detectedVersion = baseUrl?.match(/^https{0,1}:\/\/.+?\/(_cms\/){0,1}([a-z0-9.]+)(\/|$)/)?.at(2)
    return detectedVersion || ""
  }

  /**
   * The API version for which this client was build
   */
  public get apiVersion(): string {
    return buildInfo.api
  }

  /**
   * The CMS version for which this client was build
   */
  public get cmsVersion(): string {
    return buildInfo.cms
  }

  public async getOpenApiSpec(): Promise<OpenAPIV3_1.Document> {
    const result = await this._client.get<OpenAPIV3_1.Document>({
      url: '/docs/content-openapi.json',
      throwOnError: false
    })
    if (this.isDataResponse(result))
      return result.data as OpenAPIV3_1.Document
    throw new ApiError(result)
  }

  public getSchemaItemBase(): URL | undefined {
    let baseUrl = this._client.getConfig().baseUrl
    if (typeof (baseUrl) === 'string' && !baseUrl.endsWith('/'))
      baseUrl = baseUrl + '/'
    return baseUrl ? new URL(baseUrl) : undefined
  }
}

export { ApiError } from "@remkoj/hey-api-wrapper";
export const ApiClient = withOperations(BaseApiClient, Operations);
export type ApiClientStatic = typeof ApiClient;
export type CmsIntegrationApiClient = InstanceType<typeof ApiClient>;
export default ApiClient;
