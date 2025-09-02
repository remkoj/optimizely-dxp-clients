import { OptiCmsVersion } from './types'

export type CmsIntegrationApiOptions = {
  base?: URL
  clientId?: string
  clientSecret?: string
  actAs?: string
  debug?: boolean

  /**
   * The CMS Schema version that is used
   */
  cmsVersion?: OptiCmsVersion
}
type ClientCredentials = 'clientId' | 'clientSecret' | 'cmsVersion'

export function readPartialEnvConfig(): CmsIntegrationApiOptions {
  const cmsUrl = getOptional('OPTIMIZELY_CMS_URL')
  const clientId = getOptional('OPTIMIZELY_CMS_CLIENT_ID')
  const clientSecret = getOptional('OPTIMIZELY_CMS_CLIENT_SECRET')
  const actAs = getOptional('OPTIMIZELY_CMS_USER_ID')
  const debug = getOptional('OPTIMIZELY_DEBUG', "0") == "1"
  const cmsVersion = getSelection<OptiCmsVersion>('OPTIMIZELY_CMS_SCHEMA', [OptiCmsVersion.CMS12, OptiCmsVersion.CMS13, OptiCmsVersion.CMSSAAS], OptiCmsVersion.CMSSAAS)

  // Determine the base, if set by the config
  let base: URL | undefined
  if (cmsUrl) {
    try {
      base = new URL(cmsUrl.includes("://") ? cmsUrl : 'https://' + cmsUrl)
    } catch (e) {
      throw new Error("Invalid Optimizely CMS URL provided")
    }
  }

  if (debug)
    console.log(`[Optimizely CMS API] Connecting to ${base || 'CMS API HOST'} as ${clientId ?? 'Anonymous'}`)

  return {
    base,
    clientId,
    clientSecret,
    actAs,
    debug,
    cmsVersion
  }
}

export function readEnvConfig(): Omit<CmsIntegrationApiOptions, ClientCredentials> & Pick<Required<CmsIntegrationApiOptions>, ClientCredentials> {
  const partialConfig = readPartialEnvConfig()

  if (!partialConfig.clientId)
    throw new Error("The Client ID (OPTIMIZELY_CMS_CLIENT_ID) is a required environment variable")

  if (!partialConfig.clientSecret)
    throw new Error("The Client Secret (OPTIMIZELY_CMS_CLIENT_SECRET) is a required environment variable")

  return partialConfig as Omit<CmsIntegrationApiOptions, ClientCredentials> & Pick<Required<CmsIntegrationApiOptions>, ClientCredentials>
}

function getOptional<DT extends string | undefined>(variable: string, defaultValue?: DT): DT extends string ? string : string | undefined {
  const envValue = process.env[variable]
  if (!envValue || envValue == "")
    return defaultValue as DT extends string ? string : undefined
  return envValue
}
function getMandatory(variable: string): string {
  const envValue = process.env[variable]
  if (!envValue)
    throw new Error(`The environment variable ${variable} is missing or empty`)
  return envValue
}
function getSelection<T>(envVarName: string, allowedValues: T[], defaultValue: T): T {
  const rawValue = getOptional(envVarName, defaultValue as string)
  if (!rawValue)
    return defaultValue
  if (allowedValues.some(av => av == rawValue))
    return rawValue as T
  return defaultValue
}