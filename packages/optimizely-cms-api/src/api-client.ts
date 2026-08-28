import { withOperations, ApiClient as AbstractApiClient, ApiError } from "@remkoj/hey-api-wrapper";
import * as Operations from './client/sdk.gen';
import { createClient, createConfig } from './client/client';
import { createClientConfig } from './client-config';
import { DEFAULT_API_BASEURL, type CmsIntegrationApiOptions, readEnvConfig } from "./config";
import buildInfo from "./version.json";
import type { OpenAPIV3_1 } from "openapi-types";

/**
 * Base implementation of the ApiClient wrapper for the Optimizely CMS Rest API.
 * Operation methods (e.g. `listContent`) are mixed in via {@link withOperations}
 * below; this class only owns configuration/base-URL resolution and the
 * version/schema helpers.
 */
class BaseApiClient extends AbstractApiClient<CmsIntegrationApiOptions, ReturnType<typeof createClient>> {
  /**
   * @param config Optional client configuration. When omitted, configuration
   * is read from environment variables via {@link readEnvConfig}.
   */
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
   * 
   * @deprecated  No longer exposed by API v1 and newer
   */
  public get cmsVersion(): string {
    return buildInfo.cms
  }

  /**
   * Fetches the OpenAPI specification document served by the connected CMS instance.
   *
   * @returns The parsed OpenAPI v3.1 document.
   * @throws {ApiError} When the CMS returns an error response.
   */
  public async getOpenApiSpec(): Promise<OpenAPIV3_1.Document> {
    const result = await this._client.get<OpenAPIV3_1.Document>({
      url: '/docs/content-openapi.json',
      throwOnError: false
    })
    if (this.isDataResponse(result))
      return result.data as OpenAPIV3_1.Document
    throw new ApiError(result)
  }

  /**
   * The base URL schema/content item locations are resolved against, always
   * carrying a trailing slash so relative references append rather than replace.
   *
   * @returns The base URL, or `undefined` when the client has no configured base URL.
   */
  public getSchemaItemBase(): URL | undefined {
    let baseUrl = this._client.getConfig().baseUrl
    if (typeof (baseUrl) === 'string' && !baseUrl.endsWith('/'))
      baseUrl = baseUrl + '/'
    return baseUrl ? new URL(baseUrl) : undefined
  }
}

export { ApiError } from "@remkoj/hey-api-wrapper";

/**
 * The concrete CMS Integration API client class: {@link BaseApiClient} extended
 * with one method per generated CMS API operation (see `./client/sdk.gen`).
 */
export const ApiClient = withOperations(BaseApiClient, Operations);

/** The static (constructor) side of {@link ApiClient}. */
export type ApiClientStatic = typeof ApiClient;

/** An instance of {@link ApiClient}, as returned by `createClient()`. */
export type CmsIntegrationApiClient = InstanceType<typeof ApiClient>;

export default ApiClient;
