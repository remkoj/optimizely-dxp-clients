import type { CliModule } from '../types.js'
import { parseArgs } from '../tools/parseArgs.js'
import { OptiCmsVersion, IntegrationApi } from '@remkoj/optimizely-cms-api'
import { createCmsClient } from '../tools/cmsClient.js'
import { getStyles } from '../tools/styles.js'
import { glob } from 'glob'
import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'
import Table from 'cli-table3'
import { generatePatch, getPatchFields } from '../tools/patch.js'

type StylesPushModule = CliModule<{
  excludeTemplates: string[]
  templates?: string[]
}>

/**
 * CLI command that synchronizes local `.opti-style.json` definitions with Optimizely CMS.
 *
 * Existing styles are patched, missing styles are created, and command options allow
 * selecting or excluding template keys during the push.
 */
export const StylesPushCommand: StylesPushModule = {
  command: 'styles:push',
  describe: 'Push Visual Builder style definitions into the CMS (create/patch)',
  builder: (yargs) => {
    yargs.option('excludeTemplates', {
      alias: 'e',
      description: 'Exclude these templates',
      string: true,
      type: 'array',
      demandOption: false,
      default: [],
    })
    yargs.option('templates', {
      alias: 't',
      description: 'Select only these templates',
      string: true,
      type: 'array',
      demandOption: false,
      default: [],
    })
    return yargs
  },
  handler: async (args) => {
    const {
      _config: { debug = false },
      excludeTemplates,
      templates,
      ...opts
    } = parseArgs(args)
    const client = createCmsClient(args)
    if (client.runtimeCmsVersion == OptiCmsVersion.CMS12) {
      process.stdout.write(
        chalk.gray(`${figures.cross} Styles are not supported on CMS12\n`)
      )
      return
    }

    const { styles: displayTemplates } = await getStyles(
      client,
      {
        // Defaults
        all: true,
        baseTypes: [],
        excludeBaseTypes: [],
        excludeNodeTypes: [],
        excludeTemplates: [],
        excludeTypes: [],
        nodes: [],
        templates: [],
        templateTypes: [],
        types: [],

        // Arguments from this method
        ...args,
      },
      50
    )

    process.stdout.write(
      chalk.yellowBright(
        `${figures.arrowRight} Pushing (create/patch) DisplayStyles into Optimizely CMS\n`
      )
    )

    // Listing all style files
    const styleDefinitionFiles = await glob('./**/*.opti-style.json', {
      cwd: opts.components,
    })

    type StyleFileData = { 
      styleKey: string|null, 
      styleDefinition: IntegrationApi.DisplayTemplate,
      styleFile?: string|null
    }

    // Helper function to read the files from disk
    function readStyleFile(styleDefinitionFile: string): Partial<StyleFileData> | undefined {
      const filePath = path.normalize(path.join(opts.components, styleDefinitionFile))
      const styleDefinition = tryReadJsonFile<IntegrationApi.DisplayTemplate>(filePath, debug)
      return styleDefinition ? {
        styleKey: styleDefinition.key,
        styleDefinition,
        styleFile: filePath
      } as Partial<StyleFileData> : undefined
    }

    // Helper function to filter the files read from disk
    function filterStyleDefinition(data?: Partial<StyleFileData> | null): data is StyleFileData {
      if (!data || !data.styleKey) return false;
      const { styleKey } = data;
      if (excludeTemplates.includes(styleKey)) {
        if (debug)
          process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${styleKey} - explicitly excluded\n`))
        return false
      }

      // Skip if there a selectin and this template is not in it
      if (templates.length > 0 && !templates.includes(styleKey)) {
        if (debug)
          process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${styleKey} - not in selected list of templates\n`))
        return false // Only include defined styles, if any
      }
      return true
    }

    // Processing each file
    const results = await Promise.allSettled(
      styleDefinitionFiles
        .map(readStyleFile)
        .filter(filterStyleDefinition)
        .map(async ({ styleKey, styleDefinition, styleFile }) => {
          const displayTemplate = displayTemplates.find(dt => dt.key === styleKey);

          // Confirm we're including
          process.stdout.write(
            chalk.yellowBright(
              `${figures.arrowRight} ${ displayTemplate ? 'Updating' : 'Creating'} ${styleKey}\n`
            )
          )
          if (debug)
            process.stdout.write(chalk.gray(`${figures.arrowRight} from ${ styleFile || 'unknown source'}\n`))

          // Patch or create the template
          const newTemplate = await (displayTemplate ? (async () => {
            const patch = generatePatch(displayTemplate, styleDefinition, {
              readonlyFields: ['key','created','createdBy','lastModified','lastModifiedBy'],
            });
            if (!path || Object.entries(patch).length === 0) return displayTemplate
            
            // @ts-expect-error: We're expecting an error here due to the CMS Logic not matching 
            // the OpenAPI Specification.
            return client.displayTemplates.displayTemplatesPatch(styleKey, patch);
          })() : client.displayTemplates.displayTemplatesCreate(displayTemplate));

          // Validate the result
          const unpatchedFields = generatePatch(newTemplate, styleDefinition, {
            readonlyFields: ['key','created','createdBy','lastModified','lastModifiedBy']
          });
          if (unpatchedFields && Object.entries(unpatchedFields).length > 0)
            throw new Error(`Creating/patching of displayTemplate failed, the following fields failed: ${ getPatchFields(unpatchedFields).join('; ') }`)

          // Return the template after Create/Patch
          return newTemplate
        })
    )

    const styles = new Table({
      head: [
        chalk.yellow(chalk.bold('Name')),
        chalk.yellow(chalk.bold('Key')),
        chalk.yellow(chalk.bold('Default')),
        chalk.yellow(chalk.bold('Target')),
      ],
      colWidths: [31, 20, 9, 20],
      colAligns: ['left', 'left', 'center', 'left'],
    })
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const tpl = result.value;
        styles.push([
          tpl.displayName,
          tpl.key,
          tpl.isDefault ? figures.tick : figures.cross,
          tpl.contentType
            ? `${tpl.contentType} (C)`
            : tpl.baseType
              ? `${tpl.baseType} (B)`
              : `${tpl.nodeType} (N)`,
        ])
      } else {
        const error = result.reason;
        process.stderr.write(`Error creating/updating style: ${ error }`)
      }
    })
    process.stdout.write(styles.toString() + '\n')
    process.stdout.write(chalk.green(chalk.bold(figures.tick + ' Done')) + '\n')
  },
}

/** Default export for command registration convenience. */
export default StylesPushCommand

function tryReadJsonFile<T = any>(
  filePath: string,
  debug: boolean = false
): T | undefined {
  try {
    if (debug)
      process.stdout.write(
        chalk.gray(
          `${figures.arrowRight} Reading style definition from ${filePath}\n`
        )
      )
    return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf-8' }))
  } catch (e) {
    process.stderr.write(
      chalk.redBright(
        `${chalk.bold(figures.cross)} Error while reading ${filePath}\n`
      )
    )
  }
  return undefined
}
