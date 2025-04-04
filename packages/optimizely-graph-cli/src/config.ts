import { readEnvironmentVariables as getEnvConfig, validateConfig, applyConfigDefaults, type OptimizelyGraphConfigInternal, type OptimizelyGraphConfig } from "@remkoj/optimizely-graph-client/config"
import type { CliArgs } from './types.js'

export function getArgsConfig(args: CliArgs): OptimizelyGraphConfigInternal {
  const envConfig = getEnvConfig()
  const config: OptimizelyGraphConfig = applyConfigDefaults({
    ...envConfig,
    ...args,
  })

  if (!validateConfig(config, false))
    throw new Error("Invalid Content-Graph connection details provided")

  return config
}

export function getFrontendURL(config: OptimizelyGraphConfigInternal): URL {
  const host = config.deploy_domain ?? 'localhost:3000'
  const hostname = host.split(":")[0]
  const scheme = hostname == 'localhost' || hostname.endsWith(".local") ? 'http:' : 'https:'
  return new URL(`${scheme}//${host}/`)
}