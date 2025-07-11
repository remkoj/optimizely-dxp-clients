import type { CliModule } from '../types.js'
import chalk from 'chalk'
import figures from 'figures'
import fs from 'node:fs'
import path from 'node:path'
import { globIterate } from 'glob'
import { Ajv, type AnySchemaObject, type ErrorObject } from 'ajv'
import addFormats, { FormatsPlugin } from 'ajv-formats'
import createDM from '@fastify/deepmerge'
import deepEqual from 'fast-deep-equal'

import { createCmsClient } from '../tools/cmsClient.js'
import { loadSchema } from '../tools/loadSchema.js'

const deepmerge = createDM()

type SchemaValidateModule = CliModule<{
  //schemas: string[]
}>

export const SchemaValidateCommand: SchemaValidateModule = {
  command: "schema:validate",
  describe: "Validate the opti-type.json & opti-style.json files",
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
    const schemas = await loadSchema(client, ['DisplayTemplate', 'ContentType']);

    process.stdout.write(``)

    const styleSchema = schemas.find(x => x.title == 'DisplayTemplate')?.schema
    const typeSchema = schemas.find(x => x.title == 'ContentType')?.schema

    const [styleValidator, typeValidator] = await Promise.all([getValidator(styleSchema), getValidator(typeSchema)]);

    process.stdout.write(`\n${figures.arrowRight} Validating display templates (*.opti-style.json) and content types (*.opti-type.json).\n`)
    const patterns = ["./**/*.opti-type.json", "./**/*.opti-style.json"];
    const globMatches = globIterate(patterns, { cwd: projectPath, absolute: true });
    let allOk: boolean = true;
    for await (const fileMatch of globMatches) {
      try {
        const content = JSON.parse(fs.readFileSync(fileMatch).toString());
        let errors: ErrorObject[] | undefined = undefined;
        if (fileMatch.endsWith('.opti-type.json') && !typeValidator(content)) {
          errors = typeValidator.errors
        } else if (fileMatch.endsWith('.opti-style.json') && !styleValidator(content)) {
          errors = styleValidator.errors
        }
        if (errors) {
          allOk = false
          process.stdout.write(chalk.redBright(chalk.bold(`\n${figures.cross} ${path.relative(projectPath, fileMatch)}\n`)))
          const groupedErrors = groupErrors(errors)
          for (const instancepath in groupedErrors) {
            for (const key in groupedErrors[instancepath]) {
              const errorList = groupedErrors[instancepath][key].filter((v, i, a) => a.findIndex(pv => deepEqual(v, pv)) === i)
              for (const error of errorList) {
                process.stdout.write(`  Node ${instancepath} ${error.message}\n`)
                switch (error.keyword) {
                  case 'enum':
                    process.stdout.write(`    Allowed values: ${error.params.allowedValues.map((x: any) => x.toString()).join(', ')}\n`)
                    break;
                  case 'oneOf':
                    const matching = Array.isArray(error.params.passingSchemas) ? error.params.passingSchemas : []
                    if (matching.length === 0)
                      process.stdout.write(`    Currently none matching\n`)
                    else
                      process.stdout.write(`    Currently matching ${matching.map((x: any) => x.toString()).join(", ")}\n`)
                    break;
                  default:
                    //console.log(key, error)
                    break;
                }
              }
            }
          }
        }
      } catch (e) {
        allOk = false
        process.stdout.write(chalk.redBright(chalk.bold(`${figures.cross} ${path.relative(projectPath, fileMatch)}\n`)))
        process.stdout.write(`  ${(e as Error).message}\n`)
      }
    }

    process.stdout.write(`\n`)
    if (allOk)
      process.stdout.write(chalk.greenBright(`${figures.tick} All types & styles match the schema\n`))
    else {
      process.stdout.write(chalk.redBright(`${figures.cross} Some types & styles contain errors\n`))
      process.exit(1)
    }

  }
}

function groupErrors(errors: ErrorObject[]): { [instancePath: string]: { [keyword: string]: ErrorObject[] } } {
  const errorrsByInstance = groupErrorsByPath(errors);
  const instancePaths = Object.getOwnPropertyNames(errorrsByInstance);
  return instancePaths.reduce((previous, current) => {
    previous[current] = groupErrorsByKeyword(errorrsByInstance[current])
    return previous
  }, {} as { [instancePath: string]: { [keyword: string]: ErrorObject[] } })
}
function groupErrorsByPath(errors: ErrorObject[]): { [instancePath: string]: ErrorObject[] } {
  return errors.reduce((previous, current) => {
    const instancePath = current.instancePath == "" ? "[ROOT]" : current.instancePath
    const partial: { [instancePath: string]: ErrorObject[] } = {}
    partial[instancePath] = [current]
    return deepmerge(previous, partial)
  }, {} as { [instancePath: string]: ErrorObject[] })
}
function groupErrorsByKeyword(errors: ErrorObject[]): { [keyword: string]: ErrorObject[] } {
  const toMerge = errors.reduce((previous, current) => {
    const keyword = current.keyword
    const partial: { [keyword: string]: ErrorObject[] } = {}
    partial[keyword] = [current]
    return deepmerge(previous, partial)
  }, {} as { [keyword: string]: ErrorObject[] })
  // Enum errors must be merged
  if (toMerge.enum)
    toMerge.enum = [toMerge.enum.reduce((prev, current) => prev ? deepmerge(prev, current) : current, undefined)]
  return toMerge
}

function getValidator(schemaObject: AnySchemaObject) {
  const ajv = new Ajv({
    discriminator: true
  });
  (addFormats as unknown as FormatsPlugin)(ajv);
  return ajv.compile(schemaObject)
}

export default SchemaValidateCommand