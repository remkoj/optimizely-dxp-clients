import type { CliModule } from '../types.js'
import chalk from 'chalk'
import figures from 'figures'
import type { Stats } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

import { createCmsClient } from '../tools/cmsClient.js'
import { loadSchema } from '../tools/loadSchema.js'
import parseArgs from '../tools/parseArgs.js'

type SchemaDownloadModule = CliModule<{
  force?: boolean
  schemaDir?: string
  schemas?: string[]
}>

export const SchemaDownloadCommand: SchemaDownloadModule = {
  command: "schema:download",
  describe: "Create JSON schema files for the specified types, which you can use to configure JSON validation in your IDE of choice.",
  builder: (yargs) => {
    const newYargs = yargs
    newYargs.option('schemaDir', { alias: 'd', description: "The schema path relative to your project root directory", string: true, type: 'string', demandOption: false, default: './.schema' })
    newYargs.option('schemas', { alias: 's', description: "The schema's to download", array: true, type: 'string', demandOption: false, default: ['DisplayTemplate', 'ContentType'] })
    newYargs.option('force', { alias: 'f', description: "Overwrite existing files", boolean: true, type: 'boolean', demandOption: false, default: false });
    return newYargs
  },
  async handler(args, opts) {
    const { _config: cmsConfig, path: projectPath, force, schemaDir, schemas } = parseArgs(args);
    const client = createCmsClient(cmsConfig);

    // Loading Schema
    const schemaDefs = await loadSchema(client, schemas)

    const fullSchemaDir = path.normalize(path.join(projectPath, schemaDir));
    const relativeSchemaDir = path.relative(projectPath, fullSchemaDir);
    process.stdout.write(`\n${figures.arrowRight} Validating schema folder ${relativeSchemaDir}\n`)
    const schemaDirInfo: Stats | undefined = await fs.stat(fullSchemaDir).catch((e: any) => { if (e.code == 'ENOENT') return undefined; else throw e; });
    if (!schemaDirInfo) {
      await fs.mkdir(fullSchemaDir, { recursive: true })
    } else if (!schemaDirInfo.isDirectory()) {
      process.stderr.write(chalk.redBright(chalk.bold(`${figures.cross} [Error] The schema directory exists, but is not a directory (${relativeSchemaDir})\n`)))
      process.exit(1);
    }
    process.stdout.write(chalk.greenBright(`  ${figures.tick} `));
    process.stdout.write(`Schema directory exists\n`);

    process.stdout.write(`\n${figures.arrowRight} Writing schema files\n`)
    for (const schema of schemaDefs) {
      const schemaFile = path.normalize(path.join(fullSchemaDir, `${schema.title.toLowerCase()}.schema.json`));
      const relativePath = path.relative(projectPath, schemaFile);

      try {
        await fs.writeFile(schemaFile, JSON.stringify(schema.schema, undefined, 2), {
          encoding: "utf-8",
          flag: force ? 'w' : 'wx'
        })
        process.stdout.write(chalk.greenBright(`  ${figures.tick} `));
        process.stdout.write(`Written the ${schema.title} schema to ${relativePath}\n`);
      } catch (err: any) {
        if (!force && err.code === 'EEXIST') {
          process.stdout.write(chalk.yellowBright(`  ${figures.info} `));
          process.stdout.write(`The schema ${schema.title} already exists in ${relativePath}, run with -f to overwrite\n`);
        } else
          process.stderr.write(chalk.redBright(chalk.bold(`${figures.cross} [Error] ${err.toString()}\n`)));
      }
    }
  }
}

export default SchemaDownloadCommand