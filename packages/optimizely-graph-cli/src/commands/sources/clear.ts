import { getArgsConfig, type CliModule } from '../../app.js'
import createAdminApi, { isApiError, type SourceInfo } from '@remkoj/optimizely-graph-client/admin'
import chalk from 'chalk'
import figures from 'figures'

type CommandProps = { 
    sourceId: string
}

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
export const GraphSourceClearCommand : CliModule<CommandProps> = {
    command: ['source:clear [sourceId]','sc [sourceId]'],
    handler: async (args) => {
        // Read configuration
        const cgConfig = getArgsConfig(args)

        // Create secure client
        if (!cgConfig.app_key || !cgConfig.secret)
            throw new Error("Make sure both the Optimizely Graph App Key & Secret have been defined")

        const sourceId = args.sourceId
        if (!sourceId) {
            process.stderr.write(chalk.redBright(`${ chalk.bold(figures.cross)} Missing source ID, invoke with --help for more details`)+"\n")
            return process.exit(1)
        }

        const adminApi = createAdminApi(cgConfig)
        try {
            process.stdout.write(`${ chalk.yellow(chalk.bold(figures.arrowRight)) } Loading content source: ${ chalk.yellow( sourceId ) }\n`)
            const contentSource = (await adminApi.definitionV3.getContentV3SourceHandler(sourceId))[0] as SourceInfo
            if (!(contentSource && contentSource.id == sourceId)) {
                throw new Error("An incorrect content source was returned by Optimizely Graph")
            }

            process.stdout.write(`${ chalk.yellow(chalk.bold(figures.arrowRight)) } Removing all content from ${ chalk.yellow(contentSource.label) } (Languages: ${ chalk.yellow(contentSource.languages.join(', ')) })\n`)

            await adminApi.definitionV2.deleteContentV2DataHandler(sourceId, contentSource.languages)
            
            process.stdout.write(chalk.green(chalk.bold(figures.tick+" Done"))+"\n")
        } catch (e) {
            if (isApiError(e)) {
                if (e.status == 404) {
                    process.stderr.write(chalk.redBright(`${ chalk.bold(figures.cross)} Optimizely Graph Source with ID ${ sourceId } does not exist`)+"\n")
                } else {
                    process.stderr.write(chalk.redBright(`${ chalk.bold(figures.cross)} Optimizely Graph returned an error: HTTP ${ e.status }: ${ e.statusText }`)+"\n")
                }
                if (args.verbose)
                    console.error(chalk.redBright(JSON.stringify(e.body, undefined, 4)))
            } else {
                process.stderr.write(chalk.redBright(`${ chalk.bold(figures.cross)} Optimizely Graph returned an unknown error`)+"\n")
                if (args.verbose)
                    console.error(chalk.redBright(e))
            }
            process.exitCode = 1
            return
        }
    },
    aliases: [], 
    builder: (args) => {
        args.positional('sourceId', { type: "string", describe: "The source to clear", demandOption: true })
        return args
    },
    describe: "Remove all data for the specified source",
}