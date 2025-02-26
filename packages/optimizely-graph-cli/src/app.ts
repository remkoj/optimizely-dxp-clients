import yargs, { type CommandModule } from 'yargs'
import type { Argv } from 'yargs'
import { readEnvironmentVariables as getEnvConfig, validateConfig, applyConfigDefaults, type OptimizelyGraphConfigInternal, type OptimizelyGraphConfig } from "@remkoj/optimizely-graph-client/config"
import { isDemanded } from './utils/index.js'
import chalk from 'chalk'

export function createCliApp(scriptName: string, version?: string, epilogue?: string, envFiles?: Array<string>)
{
    let config : OptimizelyGraphConfig
    try {
        config = getEnvConfig()
    } catch (e) {
        if (envFiles)
            console.error(chalk.gray(`Included environment files: ${ envFiles.join(', ') }\n`))
        console.error(chalk.redBright(`[${ chalk.bold( (e as Error)?.name ?? "Error" )}] ${ (e as Error)?.name ?? "Unknown error" }`))
        process.exit(1)
    }
    return yargs(process.argv)
        .scriptName(scriptName)
        .version(version ?? "development")
        .usage('$0 <cmd> [args]') 
        .option("dxp_url", { alias: ["du","c"], description: "Optimizely CMS URL", string: true, type: "string", demandOption: false, default: config.dxp_url })
        .option("deploy_domain", { alias: ["dd","f"], description: "Frontend domain", string: true, type: "string", demandOption: false, default: config.deploy_domain })
        .option('app_key', { alias: ["ak", "a"], description: "Content Graph App Key", string: true, type: "string", demandOption: isDemanded(config.app_key), default: config.app_key })
        .option('secret', { alias: "s", description: "Content Graph Secret", string: true, type: "string", demandOption: isDemanded(config.secret), default: config.secret })
        .option('single_key', { alias: ["sk", "k"], description: "Content Graph Single Key", string: true, type: "string", demandOption: isDemanded(config.single_key), default: config.single_key })
        .option('gateway', { alias: "g", description: "Content Graph Gateway", string: true, type: "string", demandOption: isDemanded(config.gateway), default: config.gateway })
        .option('verbose', { description: "Enable query logging", boolean: true, type: 'boolean', demandOption: false, default: config.query_log })
        .group(['deploy_domain'], "Frontend structure:")
        .group(['dxp_url'], "Optimizely CMS Instance:")
        .group(['app_key','secret','single_key','gateway'], "Optimizely Graph Instance:")
        .group(['verbose','help','version'], "Debugging:")
        .demandCommand(1,1)
        .epilogue(epilogue ?? `Copyright Remko Jantzen - 2023-${ (new Date(Date.now())).getFullYear() }`)
        .help()
        .fail((msg, error, args) => {
            if (envFiles)
                console.error(chalk.gray(`Included environment files: ${ envFiles.join(', ') }\n`))

            if (msg)
                console.error(msg+"\n")

            if (error)
                console.error(`[${ chalk.bold(error.name ?? 'Error') }]: ${ error.message ?? ''}\n`)

            args.showHelp("error")
            process.exit(1)
        })
}

export function getArgsConfig(args: CliArgs) : OptimizelyGraphConfigInternal 
{
    const config =  applyConfigDefaults({
        dxp_url: args.dxp_url,
        deploy_domain: args.deploy_domain,
        app_key: args.app_key,
        secret: args.secret,
        single_key: args.single_key,
        gateway: args.gateway,
        query_log: args.verbose
    })

    if (!validateConfig(config, false))
        throw new Error("Invalid Content-Graph connection details provided")

    return config
}

export function getFrontendURL(config: OptimizelyGraphConfigInternal) : URL
{
    const host = config.deploy_domain ?? 'localhost:3000'
    const hostname = host.split(":")[0]
    const scheme = hostname == 'localhost' || hostname.endsWith(".local") ? 'http:' : 'https:'
    return new URL(`${ scheme }//${ host }/`)
}

export type CliApp = ReturnType<typeof createCliApp>
export type CliArgs = CliApp extends Argv<infer R> ? R : never
type CliModuleBase<P> = CommandModule<CliArgs, CliArgs & Partial<P>>
export type CliModuleArgs<P = {}> = Argv<CliArgs & Partial<P>>
export type CliModule<P = {}> = Pick<Required<CliModuleBase<P>>, 'command' | 'describe'> & Omit<CliModuleBase<P>, 'command' | 'describe'>
export type CliModuleList = CliModuleBase<any>[]

export default createCliApp