import type { CliModule } from '../types.js'
import { parseArgs } from '../tools/parseArgs.js'
import { type IntegrationApi, OptiCmsVersion } from '@remkoj/optimizely-cms-api'
import chalk from 'chalk'
import figures from 'figures'
import fs from 'node:fs'
import path from 'node:path'
import fsAsync from 'node:fs/promises'

import { createCmsClient } from '../tools/cmsClient.js'
import { StylesArgs, stylesBuilder, getStyles } from '../tools/styles.js'
import { toTypeFilesList, createTemplateMetadata, createDisplayTemplateHelper, TypeFilesListEntry } from "./styles_pull.js"

type StylesDeleteModule = CliModule<{
  definitions?: boolean
  withStyleFile?: boolean
  force?: boolean
} & StylesArgs>

export const StylesDeleteCommand: StylesDeleteModule = {
  command: "styles:delete",
  describe: "Remove Visual Builder style definitions from the CMS",
  builder: (yargs) => {
    const newYargs = stylesBuilder(yargs)
    newYargs.option('force', { alias: 'f', description: "Overwrite existing files", boolean: true, type: 'boolean', demandOption: false, default: false })
    newYargs.option('withStyleFile', { alias: 'w', description: "Delete the .opti-style.json file as weill", boolean: true, type: 'boolean', demandOption: false, default: true })
    newYargs.option("definitions", { alias: 'u', description: "Update typescript definitions", boolean: true, type: 'boolean', demandOption: false, default: true })
    return newYargs
  },
  handler: async (args) => {
    const { components: basePath } = parseArgs(args);
    const client = createCmsClient(args);
    const { styles, all: allStyles } = await getStyles(client, args, 100);


    if (styles.findIndex(x => x.isDefault) >= 0)
      process.stdout.write(chalk.redBright(chalk.bold((`\n${figures.warning} You are deleting a default Display Template this may lead to unpredicted behavior.\n\n`))))

    if (!args.force) {
      process.stdout.write(`This will remove the following display templates\n`);
      for (const style of styles) {
        process.stdout.write(` ${figures.arrowRight} ${style.displayName || style.key} [Key: ${style.key}; Default: ${style.isDefault ? 'Yes' : 'No'}]\n`);
      }
      process.stdout.write(`\nRun with -f to actually preform removal\n`);
      return
    }

    const keysToDelete = styles.map(displayTemplate => displayTemplate.key)
    const styleHelpers = await toTypeFilesList(client, allStyles, basePath, false)

    for (const displayTemplate of styles) {
      const { styleFilePath, targetType, itemPath, typesPath } = await createTemplateMetadata(client, displayTemplate, basePath, false)

      // Remove style file
      if (args.withStyleFile) {
        process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Removing *.opti-style.json file for ${displayTemplate.displayName} [${displayTemplate.key}]\n`));
        await fsAsync.rm(styleFilePath, { force: false, recursive: false, maxRetries: 1 }).catch((e: any) => {
          if (e?.code === 'ENOENT') // The file can't be deleted as it does not exist - that's the desired state
            return;
          throw e;
        })
        await fsAsync.rmdir(itemPath, { recursive: false, maxRetries: 1 }).catch((e: any) => {
          if (e?.code === 'ENOTEMPTY') {
            process.stdout.write(chalk.yellowBright(`${figures.warning} The folder is not empty, please remove ${itemPath} manually if needed\n`))
            return;
          } else if (e?.code === 'ENOENT')
            return;
          else
            throw e;
        })
      }

      // Remove/update typescript helper
      if (args.definitions && styleHelpers[targetType]) {
        process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Removing/updating displayTemplates.ts file for ${displayTemplate.displayName} [${displayTemplate.key}]\n`));
        const remainingTemplates = styleHelpers[targetType].templates.filter(x => !keysToDelete.includes(x.key))
        if (remainingTemplates.length === 0) {
          await fsAsync.rm(styleHelpers[targetType].filePath, { force: false, recursive: false, maxRetries: 1 }).catch((e: any) => {
            if (e?.code === 'ENOENT') // The file can't be deleted as it does not exist - that's the desired state
              return;
            throw e;
          })
          await fsAsync.rmdir(typesPath, { recursive: false, maxRetries: 1 }).catch((e: any) => {
            if (e?.code === 'ENOTEMPTY') {
              process.stdout.write(chalk.yellowBright(`${figures.warning} The folder is not empty, please remove ${typesPath} manually if needed\n`))
              return;
            } else if (e?.code === 'ENOENT')
              return;
            else
              throw e;
          })
        } else {
          const newEntry: TypeFilesListEntry = {
            filePath: styleHelpers[targetType].filePath,
            templates: remainingTemplates
          }
          if (!await createDisplayTemplateHelper(newEntry, targetType, false, false))
            process.stdout.write(chalk.yellowBright(`${figures.warning} The display template was not updated, please update ${newEntry.filePath} manually`))
        }
      }

      // Actually remove from CMS
      process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Removing the display template ${displayTemplate.displayName} [${displayTemplate.key}] from Optimizely CMS\n`));
      const deleteResult = await client.displayTemplatesDelete({ path: { key: displayTemplate.key } })
    }

    process.stdout.write("\n" + chalk.green(chalk.bold(figures.tick + " Done")) + "\n")
  }
}


export default StylesDeleteCommand