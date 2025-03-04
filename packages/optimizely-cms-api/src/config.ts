import { OptiCmsVersion } from './types'

export type CmsIntegrationApiOptions = {
  base: URL
  clientId?: string
  clientSecret?: string
  actAs?: string
  debug?: boolean

  /**
   * The CMS Schema version that is used
   */
  cmsVersion?: OptiCmsVersion
}

export function getCmsIntegrationApiConfigFromEnvironment(): CmsIntegrationApiOptions {
  const cmsUrl = getOptional('OPTIMIZELY_CMS_URL', 'https://example.cms.optimizely.com')
  const clientId = getMandatory('OPTIMIZELY_CMS_CLIENT_ID')
  const clientSecret = getMandatory('OPTIMIZELY_CMS_CLIENT_SECRET')
  const actAs = getOptional('OPTIMIZELY_CMS_USER_ID')
  const debug = getOptional('OPTIMIZELY_DEBUG', "0") == "1"
  const cmsVersion = getSelection<OptiCmsVersion>('OPTIMIZELY_CMS_SCHEMA', [OptiCmsVersion.CMS12, OptiCmsVersion.CMS13], OptiCmsVersion.CMS13)

  let baseUrl: URL
  try {
    const cmsUrlAdjusted = cmsUrl.includes("://") ? cmsUrl : 'https://' + cmsUrl
    baseUrl = new URL('/_cms/preview2', cmsUrlAdjusted)
    if (cmsVersion == OptiCmsVersion.CMS12)
      baseUrl.pathname = baseUrl.pathname.replace('preview2', 'preview1')
  } catch (e) {
    throw new Error("Invalid Optimizely CMS URL provided")
  }

  if (debug)
    console.log(`[Optimizely CMS API] Connecting to ${baseUrl} as ${clientId}`)

  return {
    base: baseUrl,
    clientId,
    clientSecret,
    actAs,
    debug,
    cmsVersion
  }
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