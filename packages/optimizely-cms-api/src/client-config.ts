import type { CreateClientConfig } from './client/client.gen';
import type { ClientOptions, Config, Auth } from './client/client';
import { getAuthBaseUrl, readPartialEnvConfig, resolveApiBaseUrl, type CmsIntegrationApiOptions } from "./config"
import { getAccessToken } from "./getaccesstoken"

type CreateConfig<T extends ClientOptions = ClientOptions> = (config?: Config<ClientOptions & T>, apiConfig?: CmsIntegrationApiOptions) => Config<Required<ClientOptions> & T>

/**
 * Creates a fully resolved API client configuration.
 *
 * The function combines explicit client configuration with environment-based
 * defaults and sets up bearer token authentication for requests.
 *
 * @param config - Optional core client configuration.
 * @param apiConfig - Optional API integration configuration. When omitted,
 * values are resolved from environment variables.
 * @returns A normalized client configuration with authentication support.
 */
export const createClientConfig: CreateConfig = (config, apiConfig) => {
  const envConfig = apiConfig || readPartialEnvConfig();
  const baseUrl = resolveApiBaseUrl(envConfig)?.href ?? config?.baseUrl;

  // If we don't have a valid base URL just return the config as given
  if (!baseUrl)
    return { ...config }

  if (envConfig.debug)
    console.log(`⚪ [CMS API] Creating API-Client for ${baseUrl} as ${envConfig.actAs ?? envConfig.clientId}\n`)

  const authBaseUrl = getAuthBaseUrl(baseUrl).href;

  if (envConfig.debug)
    console.log(`⚪ [CMS API] Creating API-Client for ${baseUrl}\n`)

  let clientToken: string | undefined = undefined;

  const newClientConfig: ReturnType<CreateClientConfig> & { security?: Array<Auth> } = {
    ...config,
    security: [{
      in: 'header',
      name: 'Authorization',
      scheme: 'bearer',
      type: 'apiKey'
    }],
    auth: async (auth: Auth) => {
      if (auth.type !== 'apiKey' || auth.scheme !== 'bearer') {
        if (envConfig.debug)
          console.error(`❌ [CMS API] Unsupported auth model`, auth)
        return undefined;
      }
      if (typeof (clientToken) !== 'string' || clientToken.length == 0) {
        try {
          const token = await getAccessToken(envConfig, authBaseUrl);
          clientToken = token;
          if (envConfig.debug)
            console.log(`🔑 [CMS API] Using new token`);
        } catch (error: unknown) {
          if (envConfig.debug)
            console.error(`❌ [CMS API] Error while resolving the Access Token`, error)
          clientToken = undefined
        }
      } else if (envConfig.debug)
        console.log(`🔑 [CMS API] Using previously generated token`);

      return clientToken;
    },
    baseUrl: baseUrl,
  }

  return newClientConfig
};
