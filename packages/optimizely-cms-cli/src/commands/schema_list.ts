import type { CliModule } from '../types.js'
import chalk from 'chalk'
import figures from 'figures'
import Table from 'cli-table3'

import { createCmsClient } from '../tools/cmsClient.js'

type SchemaListModule = CliModule<{}>

export const SchemaListCommand: SchemaListModule = {
  command: "schema:list",
  describe: "List all schema's that are available within the SaaS CMS instance",
  builder: (yargs) => {
    const newYargs = yargs
    return newYargs
  },
  async handler(args, opts) {
    const client = createCmsClient(args);

    process.stdout.write(`\n${figures.arrowRight} Downloading OpenAPI Specification\n`)
    const spec = await client.getOpenApiSpec();
    process.stdout.write(chalk.greenBright(`  ${figures.tick} `));
    process.stdout.write(`The ${spec.info.title} (Version: ${spec.info.version}) specification has been downloaded.\n`);

    const specSchemas = (spec?.components?.schemas ?? {}) as { [key: string]: { description?: string } }

    const schemas = new Table({
      head: [
        chalk.yellow(chalk.bold("Key")),
        chalk.yellow(chalk.bold("Description"))
      ],
      colWidths: [35, 60],
      colAligns: ["left", "left"],
      wordWrap: true,
      wrapOnWordBoundary: true
    })
    for (const key in specSchemas) if (key) {
      schemas.push([key, specSchemas[key].description?.replaceAll(/\s+/g, ' ') ?? `-`])
    }
    process.stdout.write("\n" + schemas.toString() + "\n")
    process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n")
  }
}

export default SchemaListCommand