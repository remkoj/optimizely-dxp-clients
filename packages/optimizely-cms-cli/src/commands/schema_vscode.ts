import type { CliModule } from '../types.js'
import chalk from 'chalk'
import figures from 'figures'
import fs from 'node:fs'
import path from 'node:path'

import { createCmsClient } from '../tools/cmsClient.js'
import { loadSchema } from '../tools/loadSchema.js'

type SchemaVsCodeModule = CliModule<{
  //schemas: string[]
}>

export const SchemaVsCodeCommand: SchemaVsCodeModule = {
  command: "schema:vscode",
  describe: "Configure schema validation for opti-type.json & opti-style.json files by VSCode in the current project folder",
  builder: (yargs) => {
    const newYargs = yargs
    //newYargs.option('schemas', { alias: 's', description: "The schema's to download", array: true, type: 'string', demandOption: false, default: ['DisplayTemplate', 'ContentType'] })
    //newYargs.option('force', { alias: 'f', description: "Overwrite existing files", boolean: true, type: 'boolean', demandOption: false, default: false })
    //newYargs.option("definitions", { alias: 'd', description: "Create/overwrite typescript definitions", boolean: true, type: 'boolean', demandOption: false, default: true })
    return newYargs
  },
  handler: async (args) => {
    const projectPath = args.path;
    const client = createCmsClient(args);


    const schemas = await loadSchema(client, ['DisplayTemplate', 'ContentType'])

    process.stdout.write(`\n${figures.arrowRight} Writing schema files\n`)
    for (const schema of schemas) {
      const schemaFile = path.join(projectPath, '.vscode', `${schema.title.toLowerCase()}.schema.json`);
      void await writeFileAsync(schemaFile, JSON.stringify(schema.schema, undefined, 2));
      process.stdout.write(`  ${figures.tick} Written the ${schema.title} schema to ${path.relative(projectPath, schemaFile)}\n`)
    }

    process.stdout.write(`\n${figures.arrowRight} Updating folder settings\n`)
    const settingsFile = path.join(projectPath, '.vscode', 'settings.json');
    const settings = (await readJsonFileAsync(settingsFile).catch(() => undefined)) ?? {};
    settings['json.validate.enable'] = true;
    settings['json.schemaDownload.enable'] = true;
    settings['json.schemas'] = settings['json.schemas'] || [];
    const hasContentType = (settings['json.schemas'] as Array<{ fileMatch: string[], url: string }>).findIndex(v => v.fileMatch.findIndex(fm => fm.endsWith('.opti-type.json')) >= 0) >= 0
    const hasStyleDefinition = (settings['json.schemas'] as Array<{ fileMatch: string[], url: string }>).findIndex(v => v.fileMatch.findIndex(fm => fm.endsWith('.opti-style.json')) >= 0) >= 0
    const hasSchemaType = (settings['json.schemas'] as Array<{ fileMatch: string[], url: string }>).findIndex(v => v.fileMatch.findIndex(fm => fm.endsWith('.schema.json')) >= 0) >= 0

    if (!hasContentType)
      settings['json.schemas'].push({
        "fileMatch": [
          "**/*.opti-type.json"
        ],
        "url": "./.vscode/contenttype.schema.json"
      });

    if (!hasStyleDefinition)
      settings['json.schemas'].push({
        "fileMatch": [
          "**/*.opti-style.json"
        ],
        "url": "./.vscode/displaytemplate.schema.json"
      });
    if (!hasSchemaType)
      settings['json.schemas'].push({
        "fileMatch": [
          "**/*.schema.json"
        ],
        "url": "https://json-schema.org/draft-07/schema"
      });

    if (settings['json.schemas'].length == 0)
      delete settings['json.schemas'];

    await writeFileAsync(settingsFile, JSON.stringify(settings, undefined, 2))
  }
}

function readJsonFileAsync<T>(path: fs.PathOrFileDescriptor): Promise<T | undefined> {
  return new Promise((resolve, reject) => fs.readFile(path, (err, data) => {
    if (err) {
      if (err?.code === 'ENOENT')
        resolve(undefined)
      else
        reject(err)
    } else {
      try {
        const d = data.toString();
        resolve(JSON.parse(d))
      } catch (e) {
        reject(e)
      }
    }
  }))
}

function writeFileAsync(path: fs.PathOrFileDescriptor, data: string | NodeJS.ArrayBufferView) {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(path, data, (err) => {
      if (err)
        reject(err);
      else
        resolve();
    })
  })
}

export default SchemaVsCodeCommand