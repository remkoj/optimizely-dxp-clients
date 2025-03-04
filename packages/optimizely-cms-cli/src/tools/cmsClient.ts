import type { CliModule } from '../types.js'
import { createClient, type CmsIntegrationApiClient as CmsApiClient } from '@remkoj/optimizely-cms-api'
import { getCmsIntegrationApiConfigFromEnvironment } from '@remkoj/optimizely-cms-api'
import { parseArgs } from '../tools/parseArgs.js'
import chalk from 'chalk'
import figures from 'figures'

export function createCmsClient(args: Parameters<CliModule['handler']>[0]): CmsApiClient {
  const { _config: cfg } = parseArgs(args)
  const baseConfig = getCmsIntegrationApiConfigFromEnvironment()
  const client = createClient({
    ...baseConfig,
    ...cfg
  })
  if (cfg.debug)
    process.stdout.write(chalk.gray(`${figures.arrowRight} Connecting to ${cfg.base.href} as ${cfg.actAs ?? cfg.clientId}\n`))
  return client
}

export default createCmsClient