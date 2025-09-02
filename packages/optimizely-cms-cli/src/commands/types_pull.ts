import type { CliModule } from '../types.js'
import { parseArgs } from '../tools/parseArgs.js'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'

import { createCmsClient } from '../tools/cmsClient.js'
import { getContentTypes, ContentTypesArgs, contentTypesBuilder, getContentTypePaths } from '../tools/contentTypes.js'

type TypesPullModule = CliModule<{
  force: boolean
} & ContentTypesArgs>

export const TypesPullCommand: TypesPullModule = {
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

    const updatedTypes: Array<string> = contentTypes.map(contentType => {
      const { typePath, typeFile } = getContentTypePaths(contentType, basePath);

      if (!fs.existsSync(typePath))
        fs.mkdirSync(typePath, { recursive: true })

      if (fs.existsSync(typeFile) && !force) {
        if (debug)
          process.stdout.write(chalk.yellow(`${figures.cross} Skipping type definition for ${contentType.displayName} (${contentType.key}) - File already exists\n`))
        return contentType.key
      }

      const outContentType = { ...contentType }
      if (outContentType.source || outContentType.source == "") delete outContentType.source
      //if (outContentType.features) delete outContentType.features
      //if (outContentType.usage) delete outContentType.usage
      if (outContentType.lastModifiedBy) delete outContentType.lastModifiedBy
      if (outContentType.lastModified) delete outContentType.lastModified
      if (outContentType.created) delete outContentType.created

      for (const propName of Object.getOwnPropertyNames(outContentType.properties ?? {})) {
        if (!["content", "contentReference"].includes(outContentType.properties[propName].type)) {
          if (isEmptyArray(outContentType.properties[propName].allowedTypes))
            delete outContentType.properties[propName].allowedTypes
          if (isEmptyArray(outContentType.properties[propName].restrictedTypes))
            delete outContentType.properties[propName].restrictedTypes
        }
        if (outContentType.properties[propName].type == 'array' && !["content", "contentReference"].includes(outContentType.properties[propName].items?.type)) {
          if (isEmptyArray(outContentType.properties[propName].items.allowedTypes))
            delete outContentType.properties[propName].items.allowedTypes
          if (isEmptyArray(outContentType.properties[propName].items.restrictedTypes))
            delete outContentType.properties[propName].items.restrictedTypes
        }
      }

      if (debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Writing type definition for ${contentType.displayName} (${contentType.key})\n`))
      fs.writeFileSync(typeFile, JSON.stringify(outContentType, undefined, 2))
      return contentType.key
    }).filter(x => x)

    process.stdout.write(chalk.green(chalk.bold(`${figures.tick} Created/updated type definitions for ${updatedTypes.join(', ')}\n`)))
  }
}

export default TypesPullCommand

function isNonEmptyArray<T>(toTest?: Array<T> | null | undefined): toTest is Array<T> {
  return Array.isArray(toTest) && toTest.length > 0;
}
function isEmptyArray<T>(toTest?: Array<T> | null | undefined): toTest is Array<T> | null {
  return toTest === null || !Array.isArray(toTest) || toTest.length === 0;
}