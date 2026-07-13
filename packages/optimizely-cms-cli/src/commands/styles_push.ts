import type { CliModule } from '../types.js'
import { parseArgs } from '../tools/parseArgs.js'
import { IntegrationApi } from '@remkoj/optimizely-cms-api'
import { createCmsClient } from '../tools/cmsClient.js'
import { glob } from 'glob'
import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'
import Table from 'cli-table3'
import { getStyles } from '../tools/styles.js'
import { generatePatch, getPatchFields } from '../tools/patch.js'
import { isDefined } from '../tools/filters.js'

type StylesPushModule = CliModule<{
  excludeTemplates: string[]
  templates?: string[]
}>

export const StylesPushCommand: StylesPushModule = {
  command: "styles:push",
  describe: "Push Visual Builder style definitions into the CMS (create/replace)",
  builder: (yargs) => {
    yargs.option('excludeTemplates', { alias: 'e', description: "Exclude these templates", string: true, type: 'array', demandOption: false, default: [] })
    yargs.option("templates", { alias: 't', description: "Select only these templates", string: true, type: 'array', demandOption: false, default: [] })
    return yargs
  },
  handler: async (args) => {
    const { _config: cfg, excludeTemplates, templates, ...opts } = parseArgs(args)
    const client = createCmsClient(args)

    const { styles: displayTemplates } = await getStyles(client, {
      all: false,
      baseTypes: [],
      excludeBaseTypes: [],
      excludeNodeTypes: [],
      excludeTemplates: [],
      excludeTypes: [],
      nodes: [],
      templates: [],
      templateTypes: [],
      types: [],
      ...args
    }, 50);

    process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Pushing (create/replace) DisplayStyles into Optimizely CMS\n`))
    const styleDefinitionFiles = await glob("./**/*.opti-style.json", {
      cwd: opts.components
    })
    const results = (await Promise.allSettled(styleDefinitionFiles.map(async styleDefinitionFile => {
      const filePath = path.normalize(path.join(opts.components, styleDefinitionFile))
      const styleDefinition = tryReadJsonFile<IntegrationApi.DisplayTemplate>(filePath, cfg.debug)
      const styleKey = styleDefinition.key
      if (!styleKey) {
        process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} The style definition in ${path.relative(opts.path, filePath)} does not have a key defined\n`))
        return undefined
      }
      if (excludeTemplates.includes(styleKey)) return undefined // Skip excluded styles
      if (templates.length > 0 && !templates.includes(styleKey)) return undefined // Only include defined styles, if any
      if (cfg.debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Pushing: ${styleKey}\n`))

      // Try to fetch the current template
      const currentTemplate = displayTemplates.find(dt => dt.key === styleKey)

      // Create / Replace the current template
      const newTemplate = await (currentTemplate ? (async () => {
        const patch = generatePatch(currentTemplate, styleDefinition, {
          readonlyFields: ['key', 'created', 'lastModified', 'createdBy', 'lastModifiedBy'],
          atomicFields: ['settings']
        })
        if (!path || Object.entries(patch).length === 0) return currentTemplate
        return client.displayTemplatesPatch({ path: { key: styleKey }, body: patch }) 
      })() :
        client.displayTemplatesCreate({ body: styleDefinition })
      )

      const missedFields = newTemplate ? generatePatch(newTemplate, currentTemplate, {
        readonlyFields: ['key', 'created', 'lastModified', 'createdBy', 'lastModifiedBy']
      }) : undefined;
      if (missedFields && Object.keys(missedFields).length > 0)
        throw new Error(`The Display template ${ styleKey } failed to update properties: ${ getPatchFields(missedFields).join('; ') }`)

      return newTemplate
    })));

    const styles = new Table({
      head: [
        chalk.yellow(chalk.bold("Name")),
        chalk.yellow(chalk.bold("Key")),
        chalk.yellow(chalk.bold("Default")),
        chalk.yellow(chalk.bold("Target"))
      ],
      colWidths: [31, 20, 9, 20],
      colAligns: ["left", "left", "center", "left"]
    })
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        if (isDefined(result.value)) {
          const tpl = result.value;
          styles.push([
            tpl.displayName,
            tpl.key,
            tpl.isDefault ? figures.tick : figures.cross,
            tpl.contentType ? `${tpl.contentType} (C)` : tpl.baseType ? `${tpl.baseType} (B)` : `${tpl.nodeType} (N)`
          ])
        } else {
          process.stderr.write(`DisplayTemplate pushed without errors, but no result was returned.\n`)
        }
      } else {
        process.stderr.write(`Error processing DisplayTemplate: ${ result.reason ?? "n" }\n`)
      }
    })
    process.stdout.write(styles.toString() + "\n")
    process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n")
  }
}
export default StylesPushCommand

function tryReadJsonFile<T = unknown>(filePath: string, debug: boolean = false): T | undefined {
  try {
    if (debug)
      process.stdout.write(chalk.gray(`${figures.arrowRight} Reading style definition from ${filePath}\n`))
    return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf-8' }))
  } catch {
    process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Error while reading ${filePath}\n`))
  }
  return undefined
}
