import { type CmsIntegrationApiOptions, readPartialEnvConfig } from '@remkoj/optimizely-cms-api'
import yargs from 'yargs'
import { type OptiCmsApp } from './types.js'
import chalk from 'chalk';

export function createOptiCmsApp(scriptName: string, version?: string, epilogue?: string, envFiles?: Array<string>): OptiCmsApp {
  if (envFiles) {
    process.stdout.write(chalk.bold(`✅ Loaded environment files:`) + "\n")
    envFiles.forEach(envFile => {
      process.stdout.write(`  👉 ${envFile}\n`)
    })
    process.stdout.write("\n")
  }
  let config: CmsIntegrationApiOptions;
  try {
    config = readPartialEnvConfig()
  } catch (e) {
    console.error(chalk.redBright(`${chalk.bold("[ERROR]:")} Error processing environment variables: ${e.message}`))
    process.exit(1)
  }
  return yargs(process.argv)
    .scriptName(scriptName)
    .version(version ?? "development")
    .usage('$0 <cmd> [args]')
    .option("path", { alias: "p", description: "Application root folder", string: true, type: "string", demandOption: false, default: process.cwd() })
    .option("components", { alias: "c", description: "Path to components folder", string: true, type: "string", demandOption: false, default: "./src/components/cms" })
    .option("cms_url", { alias: "cu", description: "Optimizely CMS URL", string: true, type: "string", demandOption: isDemanded(config.base), default: config.base, coerce: (val) => val ? new URL(val) : undefined })
    .option("client_id", { alias: "ci", description: "API Client ID", string: true, type: "string", demandOption: isDemanded(config.clientId), default: config.clientId })
    .option('client_secret', { alias: "cs", description: "API Client Secrent", string: true, type: "string", demandOption: isDemanded(config.clientSecret), default: config.clientSecret })
    .option('user_id', { alias: "u", description: "Impersonate user id", string: true, type: "string", demandOption: false, default: config.actAs })
    .option('verbose', { description: "Enable logging", boolean: true, type: 'boolean', demandOption: false, default: config.debug })
    .group(['path', 'components'], "Frontend:")
    .group(['cms_url', 'client_id', 'client_secret', 'user_id'], "Optimizely CMS Instance:")
    .group(['verbose', 'help', 'version'], "Debugging:")
    .demandCommand(1, 1)
    .epilogue(epilogue ?? `Copyright Remko Jantzen - 2023-${(new Date(Date.now())).getFullYear()}`)
    .help()
    .fail((msg, error, args) => {
      if (msg)
        console.error(chalk.redBright(msg) + "\n")

      if (error)
        console.error(chalk.redBright(`[${chalk.bold(error.name ?? 'Error')}]: ${error.message ?? ''}`) + '\n')

      args.showHelp("error")
    })
}

export default createOptiCmsApp

function isDemanded(value: any) {
  if (value == undefined || value == null)
    return true
  switch (typeof (value)) {
    case 'string':
      return value == ""
  }
  return false
}