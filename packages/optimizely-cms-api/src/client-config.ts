import type { CreateClientConfig } from './client/client.gen';
import type { ClientOptions, Config, Auth } from './client/client';
import { readPartialEnvConfig, type CmsIntegrationApiOptions } from "./config"
import { getAccessToken } from "./getaccesstoken"

type CreateConfig<T extends ClientOptions = ClientOptions> = (config?: Config<ClientOptions & T>, apiConfig?: CmsIntegrationApiOptions) => Config<Required<ClientOptions> & T>

export const createClientConfig: CreateConfig = (config, apiConfig) => {
  const envConfig = apiConfig || readPartialEnvConfig();
  const baseUrl = config?.baseUrl && !config.baseUrl.startsWith('/') ? new URL(config.baseUrl) : envConfig?.base ? new URL(config?.baseUrl ?? '/', envConfig.base) : undefined;

  // If we don't have a valid base URL just return the config as given
  if (!baseUrl)
    return { ...config }

  if (!baseUrl.pathname.endsWith('/'))
    baseUrl.pathname = baseUrl.pathname + '/'

  if (envConfig.debug)
    process.stdout.write(`⚪ [CMS API] Creating API-Client for ${baseUrl.href} as ${envConfig.actAs ?? envConfig.clientId}\n`)

  const authBaseUrl = baseUrl.hostname === 'api.cms.optimizely.com' ?
    new URL("/", baseUrl) :
    baseUrl

  let clientToken: string | undefined = undefined;

  const newClientConfig: ReturnType<CreateClientConfig> & { security?: Array<Auth> } = {
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
          const token = await getAccessToken(envConfig, authBaseUrl.href);
          clientToken = token;
          if (envConfig.debug)
            console.log(`🔑 [CMS API] Using new token`);
        } catch (error: any) {
          if (envConfig.debug)
            console.error(`❌ [CMS API] Error while resolving the Access Token`, error)
          clientToken = undefined
        }
      } else if (envConfig.debug)
        console.log(`🔑 [CMS API] Using previously generated token`);

      return clientToken;
    },
    ...config,
    baseUrl: baseUrl.href,
  }

  return newClientConfig
};