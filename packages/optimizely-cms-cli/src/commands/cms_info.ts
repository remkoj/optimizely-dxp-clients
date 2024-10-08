import type { CliModule } from '../types.js'
import createClient from '../tools/cmsClient.js'
import chalk from 'chalk'
import figures from 'figures'
import Table from 'cli-table3'

export const CmsVersionCommand : CliModule = {
    command: "cms:version",
    describe: "Get the CMS Version information",
    handler: async (args) => {
        const client = createClient(args)
        process.stdout.write(chalk.yellowBright(`${ figures.arrowRight } Reading version information Optimizely CMS\n`))
        const versionInfo = await client.getInstanceInfo()

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