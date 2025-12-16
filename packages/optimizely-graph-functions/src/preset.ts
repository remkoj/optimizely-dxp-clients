import { type Types } from '@graphql-codegen/plugin-helpers'

// Import base preset
import { preset as clientPreset } from '@graphql-codegen/client-preset'
import * as GraphQLRequestPlugin from '@graphql-codegen/typescript-graphql-request'
import * as AddPlugin from '@graphql-codegen/add'

// Import injected parts
import plugin, { pickPluginOptions } from './index'
import {
  executeDocumentTransforms,
  cleanFragments,
  normalizeFragmentNames,
  normalizeQueryNames,
  getComponentDocuments,
  getSectionDocuments,
  getPageDocuments,
  getInjectionTargetDocuments,
  performInjections,
  cleanFragmentSpreads,
  handleDependDirective,
} from './transform'

import type { PresetOptions } from './types'

export type { PresetOptions } from './types'

export const preset: Types.OutputPreset<PresetOptions> = {
  /**
   * Prepare the documents to be parsed by this preset, without modifying the original array
   *
   * @param       outputFilePath              The path where the output of this preset will be stored
   * @param       outputSpecificDocuments     The currently selected documents
   * @returns     An awaitable with the modified list of documents.
   */
  prepareDocuments: async (
    outputFilePath: Readonly<string>,
    outputSpecificDocuments: ReadonlyArray<Types.OperationDocument>
  ) => {
    // Get the configured documents
    const optiDocs = outputSpecificDocuments.filter<string>(
      ((x) => typeof x == 'string' && x.startsWith('opti-cms:')) as (
        x: Types.OperationDocument
      ) => x is string
    )
    const normalDocs = outputSpecificDocuments.filter(
      (x) => !(typeof x == 'string' && x.startsWith('opti-cms:'))
    )

    // Get the base documents
    const documents = clientPreset.prepareDocuments
      ? await clientPreset.prepareDocuments(outputFilePath, normalDocs)
      : [...normalDocs, `!${outputFilePath}`]

    // Transform / inject the Opti-CMS documents
    const CmsDocLoaders: Array<Types.CustomDocumentLoader> = (
      optiDocs.length == 0
        ? ['opti-cms:/fragments/13', 'opti-cms:/queries/13']
        : optiDocs
    ).map((optiDoc) => {
      const loader: Types.CustomDocumentLoader = {}
      loader[optiDoc] = { loader: '@remkoj/optimizely-graph-functions/loader' }
      return loader
    })

    // Get page documents
    const [
      pageDocuments,
      sectionDocuments,
      componentDocuments,
      injectionTargets
    ] = await Promise.all([
      getPageDocuments(),
      getSectionDocuments(),
      getComponentDocuments(),
      getInjectionTargetDocuments()
    ]);

    // Create a new, extended, array
    const allDocuments = [
      ...CmsDocLoaders, 
      ...pageDocuments,
      ...sectionDocuments,
      ...componentDocuments,
      ...injectionTargets
    ]

    function compareOperationDocuments( a: Types.OperationDocument, b: Types.OperationDocument ) {
      const aPath = typeof(a) === 'string' ? a : Object.getOwnPropertyNames(a).join(';');
      const bPath = typeof(b) === 'string' ? b : Object.getOwnPropertyNames(b).join(';');
      if ( aPath < bPath ) return -1;
      if ( aPath > bPath ) return 1;
      return 0;
    }

    allDocuments.sort(compareOperationDocuments)

    //console.log(allDocuments);
    return [...documents, ...allDocuments]
  },

  buildGeneratesSection: async (options) => {
    // Extend the default plugin configuration
    options.config = {
      // Overwriteable defaults
      dedupeFragments: true, // Remove duplicate fragment references
      emitLegacyCommonJSImports: false, //Switch to ESM

      // Provided options
      ...options.config,

      // Enforced settings
      namingConvention: 'keep', // Keep casing "as-is" from Optimizely Graph
    }

    // Change the default for fragment masking from 'useFragment' to
    // 'getFragmentData', in order to prevent issues with code checks for
    // React hooks
    if (options.presetConfig.fragmentMasking !== false) {
      options.presetConfig = {
        ...options.presetConfig,
        fragmentMasking: {
          unmaskFunctionName: 'getFragmentData',
          ...(typeof options.presetConfig?.fragmentMasking == 'object'
            ? options.presetConfig?.fragmentMasking
            : {}),
        },
      }
    }

    // Apply all changes to the document set, prior to validating it. They're executed in the order of the array
    options.documentTransforms = injectOptimizelyTransforms(options.documentTransforms, options)
    options.documents = await executeDocumentTransforms(options.documents, [
      cleanFragments,         // Remove fragments that target non-existing types
      normalizeFragmentNames, // Allow overriding of built-in fragments
      normalizeQueryNames,    // Allow overriding of built-in queries
      performInjections,      // Run injections of component fragments adjacent to placeholder fragments
      cleanFragmentSpreads,   // Remove all fragment spreads that target a fragment that does not exist in the documents
      handleDependDirective,  // Remove the "item" field in queries and fragments from the "ContentReference" type if it's not in the schema
    ], options);

    // Build the preset files
    const section: Array<Types.GenerateOptions> =
      await clientPreset.buildGeneratesSection(options)

    // Add GraphQL Request Client.
    section.push({
      filename: `${options.baseOutputDir}client.ts`,
      pluginMap: {
        add: AddPlugin,
        'typescript-graphql-request': GraphQLRequestPlugin,
      },
      plugins: [
        {
          add: {
            content: ['import type * as Schema from "./graphql";'],
          },
        },
        {
          'typescript-graphql-request': {
            ...options.config,
            useTypeImports: true,
            importOperationTypesFrom: 'Schema',
          },
        },
      ],
      schema: options.schema,
      schemaAst: options.schemaAst,
      config: {
        ...options.config,
      },
      profiler: options.profiler,
      documents: options.documents,
      documentTransforms: options.documentTransforms,
    })

    // Add the functions file, which will materialize the defined
    // functions.
    section.push({
      filename: `${options.baseOutputDir}functions.ts`,
      pluginMap: {
        ['optly-functions']: plugin,
      },
      plugins: [
        {
          ['optly-functions']: {},
        },
      ],
      schema: options.schema,
      schemaAst: options.schemaAst,
      profiler: options.profiler,
      config: {
        ...options.config,
        ...pickPluginOptions(options.presetConfig),
      },
      documents: options.documents,
      documentTransforms: options.documentTransforms,
    })

    // Update file generation configs
    section.forEach((fileConfig, idx) => {
      // Modify index.ts with additional exports
      if (fileConfig.filename.endsWith('index.ts')) {
        section[idx].plugins.unshift({
          add: {
            content: [
              'export * as Schema from "./graphql";',
              'export * from "./functions";',
              'export { getSdk, type Sdk } from "./client";',
            ],
          },
        })
        section[idx].plugins.push({
          add: {
            content: [
              '',
              `export const WITH_RECURSIVE_SUPPORT = ${options.presetConfig.recursion === true ? 'true' : 'false'};`,
            ],
          },
        })
      }

      //if (!hasOptimizelyTransform(fileConfig.documentTransforms))
      //  fileConfig.documentTransforms = injectOptimizelyTransforms(fileConfig.documentTransforms)

      // Optimizely Graph supports recursive queries to allow fetching
      // data as created in the CMS. This can cause issues when using
      // multiple GraphQL sources, hence the ability to enable/disalbe
      // the support for recursive queries.
      if (
        fileConfig.skipDocumentsValidation != true &&
        options.presetConfig.recursion === true
      ) {
        const currentOptions = fileConfig.skipDocumentsValidation || {}
        section[idx].skipDocumentsValidation = {
          ...currentOptions,
          ignoreRules: [
            ...(currentOptions.ignoreRules ?? []),
            'NoFragmentCyclesRule',
          ],
        }
      }
    })

    return section
  },
}


function injectOptimizelyTransforms(
  currentTransforms: Types.ConfiguredDocumentTransform<object>[] | undefined,
  options: Types.PresetFnArgs<PresetOptions, {
    [key: string]: any;
  }>
): Types.ConfiguredDocumentTransform<object>[] {
  const dt = currentTransforms ?? []
  dt.unshift({
    name: 'Optimizely.CMS',
    transformObject: {
      transform: (tOpts) =>
        executeDocumentTransforms(
          tOpts.documents,
          [
            cleanFragments,         // Remove fragments that target non-existing types
            normalizeFragmentNames, // Allow overriding of built-in fragments
            normalizeQueryNames,    // Allow overriding of built-in queries
            performInjections,      // Run injections of component fragments adjacent to placeholder fragments
            cleanFragmentSpreads,   // Remove all fragment spreads that target a fragment that does not exist in the documents
            handleDependDirective,  // Remove the "item" field in queries and fragments from the "ContentReference" type if it's not in the schema
          ],
          options
        ),
    },
  })
  return dt
}
function hasOptimizelyTransform(currentTransforms?: Types.ConfiguredDocumentTransform<object>[])
{
  if (!Array.isArray(currentTransforms)) return false
  return currentTransforms.some(x => x.name === 'Optimizely.CMS')
}

export default preset
