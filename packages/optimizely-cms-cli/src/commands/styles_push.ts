import type { CliModule } from '../types.js'
import { parseArgs } from '../tools/parseArgs.js'
import { OptiCmsVersion } from '@remkoj/optimizely-cms-api'
import { createCmsClient } from '../tools/cmsClient.js'
import { glob } from 'glob'
import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'
import Table from 'cli-table3'

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
    if (client.runtimeCmsVersion == OptiCmsVersion.CMS12) {
      process.stdout.write(chalk.gray(`${figures.cross} Styles are not supported on CMS12\n`))
      return
    }

    process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Pushing (create/replace) DisplayStyles into Optimizely CMS\n`))

    const styleDefinitionFiles = await glob("./**/*.opti-style.json", {
      cwd: opts.components
    })
    const results = (await Promise.all(styleDefinitionFiles.map(async styleDefinitionFile => {
      const filePath = path.normalize(path.join(opts.components, styleDefinitionFile))
      const styleDefinition = tryReadJsonFile(filePath, cfg.debug)
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
      const currentTemplate = await client.displayTemplatesGet({ path: { key: styleKey } }).catch(() => { return undefined });

      // Create / Replace the current template
      const newTemplate = await (currentTemplate ?
        client.displayTemplatesPatch({ path: { key: styleKey }, body: styleDefinition }) :
        client.displayTemplatesCreate({ body: styleDefinition })
      )
      return newTemplate
    }))).filter(isNotNullOrUndefined)

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
    results.forEach(tpl => {
      styles.push([
        tpl.displayName,
        tpl.key,
        tpl.isDefault ? figures.tick : figures.cross,
        tpl.contentType ? `${tpl.contentType} (C)` : tpl.baseType ? `${tpl.baseType} (B)` : `${tpl.nodeType} (N)`
      ])
    })
    process.stdout.write(styles.toString() + "\n")
    process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n")
  }
}
export default StylesPushCommand

function tryReadJsonFile<T = any>(filePath: string, debug: boolean = false): T | undefined {
  try {
    if (debug)
      process.stdout.write(chalk.gray(`${figures.arrowRight} Reading style definition from ${filePath}\n`))
    return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf-8' }))
  } catch (e) {
    process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Error while reading ${filePath}\n`))
  }
  return undefined
}

function isNotNullOrUndefined<T>(i: T | null | undefined | void): i is T {
  return i ? true : false
}