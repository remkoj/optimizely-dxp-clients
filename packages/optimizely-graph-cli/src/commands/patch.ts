import { type CliModule, type CliModuleArgs } from '../app.js';
import chalk from 'chalk';
import figures from 'figures';
import { compareVersions } from 'compare-versions';
import path from 'node:path';
import fs from 'node:fs';
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { exec, ExecException } from 'node:child_process';

type PatchPackagesProps = {
    rootPath?: string
    dryRun?: boolean
}

const Packages: { prefix: string, package: string }[] = [{
    package: '@graphql-codegen/visitor-plugin-common',
    prefix: 'graphql-codegen-visitor-plugin-common-',
}]

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
export const patchPackagesModule: CliModule<PatchPackagesProps> = {
    command: ['patches:apply'],
    builder: (yargs) => {
        (yargs as CliModuleArgs<PatchPackagesProps>).option('rootPath', { alias: 'p', string: true, type: 'string', default: '.', description: "Path to workspace root" });
        (yargs as CliModuleArgs<PatchPackagesProps>).option('dryRun', { alias: 't', boolean: true, type: 'boolean', default: false, description: "No changes to disk"}); 
        (yargs as CliModuleArgs<PatchPackagesProps>).group(['rootPath','dryRun'], 'Project parameters');
        return yargs
    },
    handler: async (args) => {
        const dryRun = args['dryRun'] ?? false
        const rootPath = path.resolve(path.join(process.cwd(), args['rootPath'] ?? '.'))
        const projectPath = path.join(rootPath, 'package.json')
        if (!fs.existsSync(projectPath)) {
            process.stderr.write(chalk.redBright(chalk.bold(`${figures.cross} No package.json present at the selected path.`)))
            process.exit(1)
        }
        const projectInfo = tryReadJsonFile<{ name: string, packageManager?: string, resolutions?: { [pkgName: string]: string } }>(projectPath);
        if (!projectInfo) {
            process.stderr.write(chalk.redBright(chalk.bold(`${figures.cross} Unable to read ${projectPath} as JSON file.`)))
            process.exit(1)
        }
        process.stdout.write(`${figures.arrowRight} Adding/updating resolutions for: ${projectInfo.name}\n`)

        const packagesDir = path.join(rootPath, 'packages');
        try {
            if (!fs.existsSync(packagesDir))
                fs.mkdirSync(packagesDir, { recursive: true })
        } catch {
            process.stderr.write(chalk.redBright(chalk.bold(`${figures.cross} Unable to create folder: ${packagesDir}`)))
            process.exit(1)
        }
        process.stdout.write(`${figures.arrowRight} Storing patched packages at: ${packagesDir}\n`)

        process.stdout.write(`${figures.arrowRight} Downloading list of available patch files from GitHub\n`)
        const availablePackages = await fetch("https://api.github.com/repos/remkoj/optimizely-dxp-clients/contents/dependencies/").then(r => r.json()).catch(e => undefined) as { name: string, download_url: string, size: number, sha: string }[] | undefined
        if (!Array.isArray(availablePackages) || availablePackages.length == 0) {
            process.stderr.write(chalk.redBright(figures.cross + " Unable to get available patched packages from GitHub\n"));
            process.exit(1)
        }
        process.stdout.write(chalk.greenBright(`${figures.tick} Done, list has ${availablePackages.length} entries\n`))

        const results = await Promise.allSettled(Packages.map(async pkg => {
            process.stdout.write(`\n${figures.arrowRight} Patching ${pkg.package}\n`)
            const validPackages = availablePackages.filter(x => x.name.startsWith(pkg.prefix))
            if (validPackages.length == 0) {
                const errorMsg = `No patches for ${pkg.package} available`
                process.stderr.write(chalk.redBright(`${figures.cross} ${errorMsg}\n`));
                throw new Error(errorMsg)
            }

            const availableVersions = validPackages.map(pkgInfo => {
                const regexResult = pkgInfo.name.match(/.*-v([0-9]+.[0-9]+.[0-9]+)-.*/)
                if (!regexResult)
                    return undefined
                return regexResult[1]
            }).filter(isString).sort(compareVersions).reverse()

            process.stdout.write(`${figures.arrowRight} Available versions for ${pkg.package}: ${availableVersions.join(', ')}\n`)

            const latestVersion = availableVersions.at(0)
            process.stdout.write(`${figures.arrowRight} Installing/updating ${pkg.package} to: ${latestVersion}\n`)

            const packageData = validPackages.find(x => x.name.includes(`-v${latestVersion}-`))
            if (!packageData)
                throw new Error("Unable to locate version in list, this should not be possible...")
            
            const packageFile = path.join(packagesDir, packageData?.name)
            process.stdout.write(`${ figures.arrowRight } ${ !fs.existsSync(packageFile) ? 'Creating' : 'Updating' }: ${ packageFile }\n`)

            if (!dryRun) {
                const response = await fetch(packageData.download_url)
                await finished(Readable.fromWeb(response.body as Parameters<typeof Readable['fromWeb']>[0]).pipe(fs.createWriteStream(packageFile, { flags: 'w' })))
                process.stdout.write(`${ figures.arrowRight } Downloaded: ${ packageFile }\n`)
            } else {
                process.stdout.write(chalk.yellowBright(`${ figures.warning } Dry run active, file not written\n`))
            }

            return {
                name: pkg.package,
                resulotion: `file:./${ toPosixPath(path.relative(rootPath,packageFile)) }`
            }
        }));
        
        
        process.stdout.write(`${ figures.arrowRight } Updating resolutions\n`)
        results.forEach(result => {
            if (result.status == "rejected")
                return
            projectInfo.resolutions = projectInfo.resolutions || {}
            projectInfo.resolutions[result.value.name] = result.value.resulotion
        })

        if (!dryRun) {
            process.stdout.write(`${ figures.arrowRight } Writing new package.json\n`)
            fs.writeFileSync(projectPath, JSON.stringify(projectInfo, undefined, 2))

            if (projectInfo.packageManager && projectInfo.packageManager.includes('yarn')) {
                process.stdout.write(`${ figures.arrowRight } Running 'yarn install'\n`)
                const data = await runCommand('yarn install', {
                    cwd: rootPath
                })
                process.stdout.write(data.stdout.toString())
            }
        } else {
            process.stdout.write(chalk.yellowBright(`${ figures.warning } Dry run active, package.json not updated. Updated resolutions section:\n`))
            process.stdout.write(chalk.gray(JSON.stringify(projectInfo.resolutions, undefined, 2))+"\n")
        }
        process.stdout.write(chalk.greenBright(chalk.bold(`\n${ figures.tick } Done\n\n`)))
    },
    aliases: [],
    describe: "Apply the patched packages for GraphQL Codegen",
}

function isString(a: unknown): a is string {
    return typeof (a) == 'string' && a.length > 0
}

function toPosixPath(osPath: string) {
    if (path.sep == path.posix.sep)
        return osPath
    return osPath.replace(new RegExp(path.sep == '\\' ? '\\\\' : path.sep, 'g'), path.posix.sep)
}

function tryReadJsonFile<T = any>(filename: string, validator?: (inpt: any) => inpt is T): T | undefined {
    try {
        const data = JSON.parse(fs.readFileSync(filename).toString('utf8'))
        if (validator && !validator(data))
            return undefined
        return data as T
    } catch {
        return undefined
    }
}

function runCommand(command: Parameters<typeof exec>[0], options?: Parameters<typeof exec>[1]) : Promise<{ 
    error?: ExecException | null
    stdout: string | Buffer<ArrayBufferLike>
    stderr: string | Buffer<ArrayBufferLike>
}> {
    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error)
                reject({ error, stdout, stderr })
            else
                resolve({ stderr, stdout })
        })
    });
}

export default patchPackagesModule