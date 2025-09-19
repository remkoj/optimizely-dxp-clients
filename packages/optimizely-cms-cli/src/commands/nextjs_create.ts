import { parseArgs } from '../tools/parseArgs.js'
import chalk from 'chalk'
import figures from 'figures'

import { createCmsClient } from '../tools/cmsClient.js'
import { getContentTypes } from '../tools/contentTypes.js'
import { type NextJsModule, builder, createTypeFolders } from './_nextjs_base.js'

// Sub commands
//import createFragments from './nextjs_fragments.js'
import createComponents from './nextjs_components.js'
import createVisualBuilder from './nextjs_visualbuilder.js'
import createFactories from './nextjs_factories.js'
import createStyles from './styles_pull.js'
import createTypes from './types_pull.js'

export const NextJsCreateCommand: NextJsModule = {
  command: "nextjs:create",
  describe: "Scaffold a complete Next.JS / Optimizely Graph structure",
  builder,
  handler: async (args) => {
    const { _config: cfg, components: basePath } = parseArgs(args)

    const client = createCmsClient(args)
    const getContentTypesResult = await getContentTypes(client, args)
    const { contentTypes } = getContentTypesResult
    const folders = createTypeFolders(contentTypes, basePath, cfg.debug)
    process.stdout.write(chalk.yellowBright(chalk.bold(figures.tick) + " Prepared context, to limit duplicate work") + "\n")

    // First create the base files in parallel
    await Promise.all([
      createTypes.handler(args),
      createStyles.handler({ ...args, excludeNodeTypes: [], excludeTemplates: [], nodes: [], templates: [], templateTypes: [], definitions: true }),
      //createFragments.handler(args, { loadedContentTypes: getContentTypesResult, createdTypeFolders: folders })
    ])
    process.stdout.write(chalk.yellowBright(chalk.bold(figures.tick) + " Prepared types, styles and fragments") + "\n")

    // Then create the components
    await createComponents.handler(args, { loadedContentTypes: getContentTypesResult, createdTypeFolders: folders })
    await createVisualBuilder.handler(args)
    process.stdout.write(chalk.yellowBright(chalk.bold(figures.tick) + " Created components") + "\n")

    // Finally create the factories
    await createFactories.handler(args)
    process.stdout.write(chalk.yellowBright(chalk.bold(figures.tick) + " Created component factory") + "\n")

    process.stdout.write("\n")
    process.stdout.write(chalk.green(chalk.bold(figures.tick + " Scaffolded a complete Next.JS / Optimizely Graph structure")) + "\n")
  }
}

export default NextJsCreateCommand