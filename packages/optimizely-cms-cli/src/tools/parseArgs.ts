import type { OptiCmsArgs, OptiCmsArgsWithConfig } from '../types.js'
import path from 'node:path'
import fs from 'node:fs'
import { type ArgumentsCamelCase } from 'yargs'
import chalk from 'chalk'
import figures from 'figures'

/**
 * Parse the CLI configuration into usable values
 * 
 * @param       param0      The parameters from the Command Line application
 * @returns     The arguments, with the Optimizely CMS Client parameters transformed into a configuration object
 */
export function parseArgs<AT extends ArgumentsCamelCase<OptiCmsArgs>>({ client_id, client_secret, cms_url, user_id, verbose, path: argsPath, components: argsComponents, ...args }: AT, createBasePath: boolean = true) : AT extends ArgumentsCamelCase<OptiCmsArgs<infer R>> ? ArgumentsCamelCase<OptiCmsArgsWithConfig<R>> : ArgumentsCamelCase<OptiCmsArgsWithConfig>
{
    const appPath = path.isAbsolute(argsPath) ? argsPath : path.normalize(path.join(process.cwd(), argsPath))
    const componentDir = path.normalize(path.join(argsPath, argsComponents))
    if (!componentDir.startsWith(argsPath))
        throw new Error(`The component directory ${ componentDir } is outside the application directory (${ appPath })`)

    if (createBasePath && !fs.existsSync(componentDir)) {
        if (verbose)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } The components directory ${ componentDir } does not exist yet, it will be created\n`))
        fs.mkdirSync(componentDir, { recursive: true })
    }

    if (!fs.statSync(componentDir).isDirectory()) {
        process.stderr.write(chalk.redBright(`${ chalk.bold(figures.cross) } The components path ${ componentDir } exists, but is not a folder\n`))
        process.exit(1)
    }

    return {
        _config: {
            base: cms_url,
            clientId: client_id,
            clientSecret: client_secret,
            actAs: user_id,
            debug: verbose
        },
        ...args,
        path: appPath,
        components: componentDir
    } as unknown as AT extends ArgumentsCamelCase<OptiCmsArgs<infer R>> ? ArgumentsCamelCase<OptiCmsArgsWithConfig<R>> : ArgumentsCamelCase<OptiCmsArgsWithConfig>
}

export default parseArgs