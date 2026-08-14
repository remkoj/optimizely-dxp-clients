import { type Types } from '@graphql-codegen/plugin-helpers'
import { type DocumentNode } from 'graphql'

// Import base preset
import { preset as clientPreset } from '@graphql-codegen/client-preset'
import * as GraphQLRequestPlugin from '@graphql-codegen/typescript-graphql-request'
import * as AddPlugin from '@graphql-codegen/add'

// Import injected parts
import plugin, { pickPluginOptions } from './index'
import { UnhideGeneratedComponentsPlugin } from './unhide-documents-plugin';
import { getGeneratedDocuments, configureDocumentTransforms, OptiCmsTransforms } from './transform';
import { isOptiCmsURL, OptiCmsProtocol } from './generator/virtual-location';

import type { PresetOptions } from './types'

// Pass through exports
export type { PresetOptions } from './types'

export type IOptimizelyGraphPreset = Types.OutputPreset<PresetOptions> & { 
  getDocumentTransforms: (presetConfig?: PresetOptions | boolean) => Types.OutputDocumentTransform[],
  createOutputConfig: (presetConfig?: PresetOptions) => Types.ConfiguredOutput
}

export const OptimizelyGraphPreset: IOptimizelyGraphPreset = {
  createOutputConfig(presetConfig) {
    return {
      documentTransforms: OptimizelyGraphPreset.getDocumentTransforms(presetConfig),
      preset: OptimizelyGraphPreset,
      presetConfig
    }
  },

  /**
   * Retrieve all document transforms needed by the preset, these must be
   * configured in the codegen.ts file. If they're not, then the behavior
   * may be unexpected.
   * 
   * @param debug 
   * @returns 
   */
  getDocumentTransforms(presetConfig): Types.OutputDocumentTransform[]
  {
    const pc : PresetOptions = (typeof(presetConfig) === 'boolean' ? 
      { verbose: presetConfig } :
      presetConfig) ?? { verbose: false };
    const c = configureDocumentTransforms({ presetConfig: pc });
    return c.documentTransforms.map((dt) => dt.transformObject);
  },

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
    // Split into opti-cms: virtual documents and regular documents
    const { optiCms: optiDocs, defaults: normalDocs } = splitDocuments(outputSpecificDocuments)

    // Inject the Opti-CMS documents, if there's no override in the
    // configuration.
    if (optiDocs.length === 0) {
      optiDocs.push({
        [`${OptiCmsProtocol}/fragments/13`]: { loader: '@remkoj/optimizely-graph-functions/loader' }
      }, {
        [`${OptiCmsProtocol}/queries/13`]: { loader: '@remkoj/optimizely-graph-functions/loader' }
      });
    }

    // Append default queries and fragments based upon the
    // actual data in Optimizely CMS.
    optiDocs.push(...await getGeneratedDocuments());

    // Sort the Opti CMS document definitions
    function compareOperationDocuments( a: Types.OperationDocument, b: Types.OperationDocument ) {
      const aPath = typeof(a) === 'string' ? a : Object.getOwnPropertyNames(a).join(';');
      const bPath = typeof(b) === 'string' ? b : Object.getOwnPropertyNames(b).join(';');
      if ( aPath < bPath ) return -1;
      if ( aPath > bPath ) return 1;
      return 0;
    }
    optiDocs.sort(compareOperationDocuments);

    // Apply the client-preset on the 'normal' documents
    const documents = clientPreset.prepareDocuments
      ? await clientPreset.prepareDocuments(outputFilePath, [...normalDocs])
      : [...normalDocs, `!${outputFilePath}`]

    return [...documents, ...optiDocs];
  },

  /**
   * Produce the list of output file configurations for this preset.
   *
   * Extends the `@graphql-codegen/client-preset` output with two additional files:
   * - `client.ts`    — a `graphql-request` SDK client
   * - `functions.ts` — typed wrapper functions for named Optimizely Graph queries
   *
   * Also patches `index.ts` to re-export `Schema`, `functions`, and the SDK.
   * When `recursion` is enabled, `NoFragmentCyclesRule` is suppressed on all outputs.
   */
  buildGeneratesSection: async (baseOptions) => {
    // Build the adjusted configuration
    const options = configureDefaults(baseOptions);

    if (!Array.isArray(options.documentTransforms) || options.documentTransforms.length === 0) {
      console.warn(`⚠️  Please update your GraphQL-Codegen configuration to define the 'documentTransforms' property, with the outcome from the method 'getDocumentTransforms' within the Optimizely Graph Preset.`)
      throw new Error('Invalid Optimizely Graph preset configuration detected');
    }

    // Apply opti-cms:/-only transforms directly so that client-preset's
    // processSources captures the renamed rawSDL strings for gql.ts.
    for (const transform of OptiCmsTransforms) {
      options.documents = await transform(options.documents, options.schema as unknown as DocumentNode, options.presetConfig);
    }

    // Then apply the client preset, which we're extending
    const section: Array<Types.GenerateOptions> =
      await clientPreset.buildGeneratesSection(options)

    // Add GraphQL Request Client.
    section.push(buildGeneratedFile(
      'client.ts',
      options,
      [
        {
          add: {
            content: [
              '// This is an auto-generated file, do not modify',
              'import type * as Schema from "./graphql";',
              options.config.documentMode == 'string' ? 'import { TypedDocumentString } from \'./graphql\';' : undefined
            ].filter(Boolean),
          },
        },
        {
          graphqlRequest: {
            useTypeImports: true,
            importOperationTypesFrom: 'Schema',
            rawRequest: options.presetConfig.recursion ? true : undefined,
            documentMode: options.presetConfig.recursion ? 'string' : options.config.documentMode,
            // experimentalAddDocumentNodeType: options.presetConfig.recursion ? true : undefined,
            rawString: options.presetConfig.recursion ? true : options.config.documentMode === 'string',
          },
        },
      ]
    ));

    // Add the functions file, which will materialize the defined
    // functions.
    section.push(buildGeneratedFile(
      'functions.ts',
      options,
      [
        {
          optlyFunctions: pickPluginOptions(options.presetConfig),
        },
      ]
    ));

    if (options.presetConfig.verbose) {
      section.push(buildGeneratedFile(
        'opti.generated.graphql',
        options,
        [
          'unhideDocuments'
        ]
      ))
    }

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

      // Optimizely Graph supports recursive queries to allow fetching
      // data as created in the CMS. This can cause issues when using
      // multiple GraphQL sources, hence the ability to enable/disable
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

/**
 * @deprecated Use the 'OptimizelyGraphPreset' export
 */
export const preset = OptimizelyGraphPreset;
export default OptimizelyGraphPreset;

function buildGeneratedFile<PresetConfig extends PresetOptions = PresetOptions>(
  filename: string, 
  options: Types.PresetFnArgs<PresetConfig>,
  plugins: Types.OutputConfig[],
  pluginMap?: Types.PresetFnArgs<PresetConfig>['pluginMap'],
  pluginContext?: Types.PresetFnArgs<PresetConfig>['pluginContext']
): Types.GenerateOptions {
  return {
    filename: options.baseOutputDir + filename,
    pluginMap: { ...options.pluginMap, ...pluginMap },
    plugins: plugins.map(x => typeof(x) === 'string' ? { [x]: {} }  : x),
    pluginContext: { ...options.pluginContext, ...pluginContext },
    schema: options.schema,
    schemaAst: options.schemaAst,
    profiler: options.profiler,
    config: options.config,
    documents: options.documents,
    documentTransforms: options.documentTransforms,
  }
}

function configureDefaults<PresetConfig extends PresetOptions = PresetOptions, PluginConfig = Record<string, unknown>> (
  initialOptions: Types.PresetFnArgs<PresetConfig, PluginConfig>
): Types.PresetFnArgs<PresetConfig, PluginConfig> {
  const options = { ...initialOptions };

  // Extend the default plugin configuration
  options.config = {
    // Overwriteable defaults
    dedupeFragments: true, // Remove duplicate fragment references
    preResolveTypes: true, // Flatten some types
    emitLegacyCommonJSImports: false, //Switch to ESM
    //documentMode:  options.presetConfig.recursion ? 'string' : undefined,
    
    // Provided options
    ...options.config,

    // Enforced settings
    namingConvention: 'keep', // Keep casing "as-is" from Optimizely Graph
  }
  options.presetConfig = {
    cleanup: true,
    ...options.presetConfig
  }

  // Create the global plugin map
  options.pluginMap = {
    add: AddPlugin,
    graphqlRequest: GraphQLRequestPlugin,
    optlyFunctions: plugin,
    unhideDocuments: UnhideGeneratedComponentsPlugin,
    ...options.pluginMap
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

  return options;
}

/**
 * Partition `documentList` into Optimizely virtual documents and regular documents.
 *
 * String `opti-cms:/` URLs are automatically wrapped in a `CustomDocumentLoader`
 * pointing at the built-in embedded loader. Custom loader objects already
 * configured for an `opti-cms:/` key are kept unchanged.
 *
 * @param documentList  The full list of documents from the codegen configuration
 * @returns             `{ defaults, optiCms }` — non-opti-cms docs and opti-cms docs
 */
function splitDocuments(documentList: ReadonlyArray<Types.OperationDocument>):
{ defaults: Array<Types.OperationDocument>; optiCms: Array<Types.OperationDocument> }
{
  const defaultDocuments: Array<Types.OperationDocument> = [];
  const optiCmsDocuments: Array<Types.OperationDocument> = [];

  documentList.forEach((document) => {
    // Check if this is custom loader, and if so, extract the URL
    const isCustomLoader = typeof(document) !== 'string';
    const documentUrl = isCustomLoader ? Object.getOwnPropertyNames(document).join(';') : document
    if (!documentUrl) return;

    if (isOptiCmsURL(documentUrl)) {
      // Ensure the custom loader is applied for Opti CMS URLs
      if (isCustomLoader) {
        optiCmsDocuments.push(document)
      } else {
        const loader: Types.CustomDocumentLoader = {};
        loader[documentUrl] = { loader: '@remkoj/optimizely-graph-functions/loader' };
        optiCmsDocuments.push(loader);
      }
    } else {
      defaultDocuments.push(document);
    }
  })

  return {
    defaults: defaultDocuments,
    optiCms: optiCmsDocuments
  }
}