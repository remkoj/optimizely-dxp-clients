import type { CliModule } from '../types.js'
import createClient from '../tools/cmsClient.js'
import chalk from 'chalk'
import figures from 'figures'
import Table from 'cli-table3'
import CLIInfo from '../version.json' with { type: "json" }

export const CmsVersionCommand: CliModule = {
  command: "cms:version",
  aliases: "$0",
  describe: "Get the CMS Version information",
  handler: async (args) => {
    if (args._[0] && args._[0] != "cms:version") // We're being used as fall-back with a defined function name
      throw new Error("Unknown command " + args._[0] + ", usage information:")

    const client = createClient(args)
    if (client.debug)
      process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Reading version information Optimizely CMS\n`))

    const info = new Table({
      head: [
        chalk.yellow(chalk.bold("Component")),
        chalk.yellow(chalk.bold("Version"))
      ],
      colWidths: [30, 60],
      colAligns: ["left", "left"]
    })
    info.push(["Base URL", client.cmsUrl.href])
    info.push(["Client API", client.apiVersion])
    info.push(["SDK", CLIInfo.version])

    process.stdout.write(info.toString() + "\n")
    process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n")
  }
}
export default CmsVersionCommand
