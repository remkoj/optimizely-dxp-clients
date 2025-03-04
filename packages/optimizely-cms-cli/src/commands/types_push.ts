import type { CliModule } from '../types.js'
import { parseArgs } from '../tools/parseArgs.js'
import { createClient, IntegrationApi } from '@remkoj/optimizely-cms-api'
import path from 'node:path'
import fs from 'node:fs'
import { glob } from 'glob'
import chalk from 'chalk'
import figures from 'figures'
import Table from 'cli-table3'

type TypesPushModule = CliModule<{
  force: boolean
  excludeBaseTypes: string[]
  excludeTypes: string[]
  baseTypes?: string[]
  types?: string[]
}>

export const TypesPushCommand: TypesPushModule = {
  command: "types:push",
  describe: "Push content type definition into Optimizely CMS (create / replace)",
  builder: (yargs) => {
    yargs.option('force', { alias: 'f', description: "Overwrite existing files", boolean: true, type: 'boolean', demandOption: false, default: false })
    yargs.option('excludeTypes', { alias: 'ect', description: "Exclude these content types", string: true, type: 'array', demandOption: false, default: [] })
    yargs.option('excludeBaseTypes', { alias: 'ebt', description: "Exclude these base types", string: true, type: 'array', demandOption: false, default: ['folder', 'media', 'image', 'video'] })
    yargs.option("baseTypes", { alias: 'b', description: "Select only these base types", string: true, type: 'array', demandOption: false, default: [] })
    yargs.option("types", { alias: 't', description: "Select only these types", string: true, type: 'array', demandOption: false, default: [] })
    return yargs
  },
  handler: async (args) => {
    const { _config: cfg, components: basePath, excludeBaseTypes, excludeTypes, baseTypes, types, force } = parseArgs(args)
    const client = createClient(cfg)

    // Find all type files
    process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Pushing (create/replace) Content Types into Optimizely CMS\n`))
    const typeDefinitionFiles = await glob("./**/*.opti-type.json", { cwd: basePath })

    // Read & filter all identified type files
    const typeDefinitions = typeDefinitionFiles.map(file => {
      return {
        file: file,
        definition: JSON.parse(fs.readFileSync(path.join(basePath, file), { encoding: 'utf-8' }).toString()) as IntegrationApi.ContentType
      }
    }).filter(data => {
      return (!excludeBaseTypes.includes(data.definition.baseType)) &&
        (!excludeTypes.includes(data.definition.key)) &&
        (!baseTypes || baseTypes.length == 0 || baseTypes.includes(data.definition.baseType)) &&
        (!types || types.length == 0 || types.includes(data.definition.key))
    })

    // Output selected types
    const results: Array<{ key: string, type: IntegrationApi.ContentType, file: string, error?: any }> = await Promise.all(typeDefinitions.map(type => {
      process.stdout.write(chalk.yellowBright(`  ${figures.arrowRight} Pushing ${type.definition.displayName} from ${type.file}\n`))
      const outType = { ...type.definition }
      if (outType.source) delete outType.source
      if (outType.created) delete outType.created
      if (outType.lastModified) delete outType.lastModified
      if (outType.lastModifiedBy || outType.lastModifiedBy == "") delete outType.lastModifiedBy
      if (outType.features) delete outType.features
      if (outType.usage) delete outType.usage
      return client.contentTypesPut({ path: { key: outType.key }, body: outType, query: { ignoreDataLossWarnings: force } })
        .then(ct => { return { key: type.definition.key, type: ct, file: type.file } })
        .catch(e => { return { key: type.definition.key, type: type.definition, file: type.file, error: e } })
    }))

    const overview = new Table({
      head: [
        chalk.yellow(chalk.bold("Name")),
        chalk.yellow(chalk.bold("Key")),
        chalk.yellow(chalk.bold("Status")),
        chalk.yellow(chalk.bold("Message"))
      ],
      colWidths: [31, 20, 9, 20],
      colAligns: ["left", "left", "center", "left"]
    })
    results.forEach(item => {
      overview.push([
        item.type.displayName,
        item.key,
        item.error ? chalk.redBright(chalk.bold(figures.cross)) : chalk.green(chalk.bold(figures.tick)),
        item.error ?? ''
      ])
    })
    process.stdout.write(overview.toString() + "\n")

    // Mark us as done
    process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n")
  }
}

export default TypesPushCommand