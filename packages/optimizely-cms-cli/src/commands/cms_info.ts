import type { CliModule } from '../types.js'
import type { IntegrationApi } from '@remkoj/optimizely-cms-api'
import createClient from '../tools/cmsClient.js'
import chalk from 'chalk'
import figures from 'figures'
import Table from 'cli-table3'

export const CmsVersionCommand : CliModule = {
    command: "cms:version",
    aliases: "$0",
    describe: "Get the CMS Version information",
    handler: async (args) => {
        if (args._[0]) // We're being used as fall-back with a defined function name
            throw new Error("Unknown command "+args._[0]+", usage information:")

        const client = createClient(args)
        if (client.debug)
            process.stdout.write(chalk.yellowBright(`${ figures.arrowRight } Reading version information Optimizely CMS\n`))
        const versionInfo = await client.getInstanceInfo().catch((error: IntegrationApi.ApiError) => {
            switch (error.message) {
                case "fetch failed":
                    throw new Error("Unable to connect to Optimizely CMS, please verify that the CMS URL is correct")
                default:
                    throw error
            }
        })

        const info = new Table({
            head: [
                chalk.yellow(chalk.bold("Component")),
                chalk.yellow(chalk.bold("Version"))
            ],
            colWidths: [ 20, 40 ],
            colAligns: [ "left", "left" ]
        })
        info.push(["Client", client.apiVersion])
        info.push(["API", versionInfo.apiVersion])
        info.push(["CMS", versionInfo.cmsVersion])
        info.push(["Service", versionInfo.serviceVersion])
        
        process.stdout.write(info.toString()+"\n")
        process.stdout.write(chalk.yellowBright(`${ figures.arrowRight } Optimizely CMS Status: ${ versionInfo.status }\n`))
        process.stdout.write(chalk.green(chalk.bold(figures.tick+" Done"))+"\n")
    }
}
export default CmsVersionCommand