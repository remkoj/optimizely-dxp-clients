import type { CliModule } from '../types.js'
import { createClient, type CmsIntegrationApiClient as CmsApiClient, type CmsIntegrationApiOptions } from '@remkoj/optimizely-cms-api'
import { getCmsIntegrationApiConfigFromEnvironment } from '@remkoj/optimizely-cms-api'
import { parseArgs } from '../tools/parseArgs.js'
import chalk from 'chalk'
import figures from 'figures'

export function createCmsClient(args: CmsIntegrationApiOptions): CmsApiClient
export function createCmsClient(args: Parameters<CliModule['handler']>[0]): CmsApiClient
export function createCmsClient(args: Parameters<CliModule['handler']>[0] | CmsIntegrationApiOptions): CmsApiClient {
  const cfg = getCmsIntegrationApiOptions(args)
  const baseConfig = getCmsIntegrationApiConfigFromEnvironment()
  const client = createClient({
    ...baseConfig,
    ...cfg
  })
  if (cfg.debug)
    process.stdout.write(chalk.gray(`${figures.arrowRight} Connecting to ${cfg.base.href} as ${cfg.actAs ?? cfg.clientId}\n`))
  return client
}

function getCmsIntegrationApiOptions(args: Parameters<CliModule['handler']>[0] | CmsIntegrationApiOptions): CmsIntegrationApiOptions | undefined {
  if (typeof args !== 'object' || args === null)
    return undefined

  if ((args as CmsIntegrationApiOptions).base && (typeof (args as CmsIntegrationApiOptions).base === 'object') && (typeof (args as CmsIntegrationApiOptions).base.href === 'string'))
    return args as CmsIntegrationApiOptions

  return parseArgs(args as Parameters<CliModule['handler']>[0])._config
}

export default createCmsClient