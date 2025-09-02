import type { CliModule } from '../types.js'
import type { ApiError, IntegrationApi, Preview2IntegrationApi } from '@remkoj/optimizely-cms-api'
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
    const versionInfo = await client.getInstanceInfo().catch((error: ApiError) => {
      switch (error.message) {
        case "fetch failed":
          throw new Error("Unable to connect to Optimizely CMS, please verify that the CMS URL is correct")
        default:
          throw error
      }
    })

    const hasPreview2Info = versionInfo.results.preview2Data?.baseUrl ? true : false

    const info = new Table({
      head: [
        chalk.yellow(chalk.bold("Component")),
        chalk.yellow(chalk.bold("Version"))
      ],
      colWidths: [30, 60],
      colAligns: ["left", "left"]
    })
    info.push(["Base URL", versionInfo.baseUrl ?? client.cmsUrl.href])
    if (hasPreview2Info)
      info.push(["Base URL (Preview 2)", versionInfo.results.preview2Data?.baseUrl ?? 'n/a'])
    info.push(["Client API", client.apiVersion])
    info.push(["Service API", versionInfo.apiVersion])
    if (hasPreview2Info)
      info.push(["Service API (Preview 2)", versionInfo.results.preview2Data?.apiVersion ?? 'n/a'])
    info.push(["CMS Build", versionInfo.cmsVersion])
    info.push(["Service Build", versionInfo.serviceVersion])
    info.push(["SDK", CLIInfo.version])

    process.stdout.write(info.toString() + "\n")
    process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Optimizely CMS Status: ${versionInfo.status}\n`))
    process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n")
  }
}
export default CmsVersionCommand