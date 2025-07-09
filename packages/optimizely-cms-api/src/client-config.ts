import type { CreateClientConfig } from './client/client.gen';
import { readPartialEnvConfig } from "./config"
import { getAccessToken } from "./getaccesstoken"

export const createClientConfig: CreateClientConfig = (config) => {
  const envConfig = readPartialEnvConfig();
  const baseUrl = envConfig.base.href;

  const newClientConfig: ReturnType<CreateClientConfig> = {
    baseUrl,
    auth: (auth) => {
      auth.scheme = "bearer";
      auth.type = "apiKey";
      return getAccessToken(envConfig).catch((error) => {
        if (envConfig?.debug)
          console.error(`❌ Error while resolving the Access Token`, error)
        return undefined
      })
    },
    ...config,
  }

  // Ensure the baseUrl is set
  if (!newClientConfig.baseUrl)
    newClientConfig.baseUrl = baseUrl

  return newClientConfig
};