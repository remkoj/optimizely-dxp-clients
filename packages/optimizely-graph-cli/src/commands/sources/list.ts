import { getArgsConfig } from "../../config.js";
import type { CliModule } from '../../types.js';
import createAdminApi, { isApiError, type SourceInfo } from '@remkoj/optimizely-graph-client/admin'
import chalk from 'chalk'
import figures from 'figures'
import Table from 'cli-table3'

type CommandProps = {}

/**
 * An Yargs Command module
 * 
 * exports.command: string (or array of strings) that executes this command when given on the command line, first string may contain positional args
 * exports.aliases: array of strings (or a single string) representing aliases of exports.command, positional args defined in an alias are ignored
 * exports.describe: string used as the description for the command in help text, use false for a hidden command
 * exports.builder: object declaring the options the command accepts, or a function accepting and returning a yargs instance
 * exports.handler: a function which will be passed the parsed argv.
 * exports.deprecated: a boolean (or string) to show deprecation notice.
 */
export const GraphSourceListCommand: CliModule<CommandProps> = {
  command: ['source:list', 'sl', "$0"],
  handler: async (args) => {
    if (args._[0] && args._[0] != 'source:list' && args._[0] != 'sl')
      throw new Error(`Unknown command ${chalk.bold(args._[0])}, supported usage:`)

    // Read configuration
    const cgConfig = getArgsConfig(args)

    // Create secure client
    if (!cgConfig.app_key || !cgConfig.secret)
      throw new Error("Make sure both the Optimizely Graph App Key & Secret have been defined")

    const adminApi = createAdminApi(cgConfig)
    try {
      const currentSources = (await adminApi.definitionV3.getContentV3SourceHandler()) as unknown as SourceInfo[]
      const sources = new Table({
        head: [chalk.yellow(chalk.bold("ID")), chalk.yellow(chalk.bold("Label")), chalk.yellow(chalk.bold("Languages"))],
        colWidths: [10, 50, 50]
      })

      for (const sourceDetails of currentSources) {
        sources.push([sourceDetails.id, sourceDetails.label, sourceDetails.languages.join(', ')])
      }

      process.stdout.write(sources.toString() + "\n")
      process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n")
    } catch (e) {
      if (isApiError(e)) {
        process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Optimizely Graph returned an error: HTTP ${e.status}: ${e.statusText}`) + "\n")
        if (args.verbose)
          console.error(chalk.redBright(JSON.stringify(e.body, undefined, 4)))
      } else {
        process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Optimizely Graph returned an unknown error`) + "\n")
        if (args.verbose)
          console.error(chalk.redBright(e))
      }
      process.exitCode = 1
      return
    }
  },
  aliases: [],
  describe: "List all content sources in Optimizely Graph",
}