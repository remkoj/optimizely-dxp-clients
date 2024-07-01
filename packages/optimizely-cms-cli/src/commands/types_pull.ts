import type { CliModule } from '../types.js'
import { parseArgs } from '../tools/parseArgs.js'
import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'

import { createCmsClient } from '../tools/cmsClient.js'
import { getContentTypes, ContentTypesArgs, contentTypesBuilder } from '../tools/contentTypes.js'

type TypesPullModule = CliModule<{ 
    force: boolean
} & ContentTypesArgs>

export const TypesPullCommand : TypesPullModule = {
    command: "types:pull",
    describe: "Pull content type definition files into the project",
    builder: (yargs) => {
        const newArgs = contentTypesBuilder(yargs)
        yargs.option('force', { alias: 'f', description: "Overwrite existing files", boolean: true, type: 'boolean', demandOption: false, default: false })
        return newArgs
    },
    handler: async (args) => {
        const { _config: { debug }, components: basePath, force } = parseArgs(args)
        const client = createCmsClient(args)
        const { contentTypes } = await getContentTypes(client, args)

        const updatedTypes : Array<string> = contentTypes.map(contentType => {
            const typePath = path.join(basePath, contentType.baseType, contentType.key)
            const typeFile = path.join(typePath, `${ contentType.key }.opti-type.json`)

            if (!fs.existsSync(typePath))
                fs.mkdirSync(typePath, { recursive: true })

            if (fs.existsSync(typeFile) && !force) {
                if (debug)
                    process.stdout.write(chalk.yellow(`${ figures.cross } Skipping type definition for ${ contentType.displayName } (${ contentType.key }) - File already exists\n`))
                return contentType.key
            }

            if (debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Writing type definition for ${ contentType.displayName } (${ contentType.key })\n`))
            fs.writeFileSync(typeFile, JSON.stringify(contentType, undefined, 2))
            return contentType.key
        }).filter(x => x)

        process.stdout.write(chalk.green(chalk.bold(`${ figures.tick } Created/updated type definitions for ${ updatedTypes.join(', ') }\n`)))
    }
}

export default TypesPullCommand