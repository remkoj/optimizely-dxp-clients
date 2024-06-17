import type { CliModule } from '../types.js'
import { parseArgs } from '../tools/parseArgs.js'
import { createClient } from '@remkoj/optimizely-cms-api'
import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'

type TypesPullModule = CliModule<{ 
    force: boolean
    excludeBaseTypes: string[]
    excludeTypes: string[]
    baseTypes?: string[]
    types?: string[]
}>

export const TypesPullCommand : TypesPullModule = {
    command: "types:pull",
    describe: "Pull content type definition files into the project",
    builder: (yargs) => {
        yargs.option('force', { alias: 'f', description: "Overwrite existing files", boolean: true, type: 'boolean', demandOption: false, default: false })
        yargs.option('excludeTypes', { alias: 'ect', description: "Exclude these content types", string: true, type: 'array', demandOption: false, default: []})
        yargs.option('excludeBaseTypes', { alias: 'ebt', description: "Exclude these base types", string: true, type: 'array', demandOption: false, default: ['folder','media','image','video']})
        yargs.option("baseTypes", { alias: 'b', description: "Select only these base types", string: true, type: 'array', demandOption: false, default: []})
        yargs.option("types", { alias: 't', description: "Select only these types", string: true, type: 'array', demandOption: false, default: []})
        return yargs
    },
    handler: async (args) => {
        const { _config: cfg, components: basePath, excludeBaseTypes, excludeTypes, baseTypes, types, force } = parseArgs(args)
        const client = createClient(cfg)
        const pageSize = 100

        process.stdout.write(chalk.yellowBright(`${ figures.arrowRight } Pulling Content Types from Optimizely CMS\n`))

        if (cfg.debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Fetching page 1 of ? (${ pageSize } items per page)\n`))
        let templatesPage = await client.contentTypes.contentTypesList(undefined, undefined, 0, pageSize)
        const results : (typeof templatesPage)["items"] = templatesPage.items ?? []
        let pagesRemaining = Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) - (templatesPage.pageIndex + 1)

        while (pagesRemaining > 0 && results.length < templatesPage.totalItemCount) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Fetching page ${ templatesPage.pageIndex + 2 } of ${ Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) } (${ templatesPage.pageSize } items per page)\n`))
            templatesPage = await client.contentTypes.contentTypesList(undefined, undefined, templatesPage.pageIndex + 1, templatesPage.pageSize)
            results.push(...templatesPage.items)
            pagesRemaining = Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) - (templatesPage.pageIndex + 1)
        }

        if (cfg.debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Fetched ${ results.length } Content-Types from Optimizely CMS\n`))

        if (!fs.existsSync(basePath))
            fs.mkdirSync(basePath, { recursive: true })

        if (!fs.statSync(basePath).isDirectory()) {
            process.stderr.write(chalk.redBright(`${ chalk.bold(figures.cross) } The components path ${ basePath } is not a folder\n`))
            process.exit(1)
        }

        const updatedTypes : Array<string> = results.filter(data => {
            return (!excludeBaseTypes.includes(data.baseType)) && 
                (!excludeTypes.includes(data.key)) && 
                (!baseTypes || baseTypes.length == 0 || baseTypes.includes(data.baseType)) && 
                (!types || types.length == 0 || types.includes(data.key))
        }).map(contentType => {
            const typePath = path.join(basePath, contentType.baseType, contentType.key)
            const typeFile = path.join(typePath, `${ contentType.key }.opti-type.json`)

            if (!fs.existsSync(typePath))
                fs.mkdirSync(typePath, { recursive: true })

            if (fs.existsSync(typeFile) && !force) {
                process.stdout.write(chalk.yellow(`${ figures.cross } Skipping type definition for ${ contentType.displayName } (${ contentType.key }) - File already exists\n`))
                return contentType.key
            }

            if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Writing type definition for ${ contentType.displayName } (${ contentType.key })\n`))
            fs.writeFileSync(typeFile, JSON.stringify(contentType, undefined, 2))
            return contentType.key
        }).filter(x => x)

        process.stdout.write(chalk.yellowBright(`${ figures.arrowRight } Created/updated type definitions for ${ updatedTypes.join(', ') }\n`))
        process.stdout.write(chalk.green(chalk.bold(figures.tick+" Done"))+"\n")
    }
}

export default TypesPullCommand