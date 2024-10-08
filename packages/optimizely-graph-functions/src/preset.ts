import { type Types } from '@graphql-codegen/plugin-helpers'
import { Kind, visit } from 'graphql'

// Import base preset
import { preset as clientPreset, type ClientPresetConfig as ClientPresetOptions } from '@graphql-codegen/client-preset'
import * as GraphQLRequestPlugin from '@graphql-codegen/typescript-graphql-request'
import * as AddPlugin from '@graphql-codegen/add'

// Import injected parts
import plugin, { pickPluginOptions, type PluginOptions } from './index'
import transform, { pickTransformOptions } from './transform'
import { type TransformOptions } from './types'

// Create preset configuration
export type PresetOptions = ClientPresetOptions & PluginOptions & TransformOptions

export const preset : Types.OutputPreset<PresetOptions> =
{
    /**
     * Prepare the documents to be parsed by this preset, without modifying the original array
     * 
     * @param       outputFilePath              The path where the output of this preset will be stored
     * @param       outputSpecificDocuments     The currently selected documents
     * @returns     An awaitable with the modified list of documents.
     */
    prepareDocuments: async (outputFilePath: Readonly<string>, outputSpecificDocuments: ReadonlyArray<Types.OperationDocument>) => {
        // Get the configured documents
        const optiDocs = outputSpecificDocuments.filter<string>((x => typeof(x) == 'string' && x.startsWith('opti-cms:')) as (x: Types.OperationDocument) => x is string)
        const normalDocs = outputSpecificDocuments.filter(x => !(typeof(x) == 'string' && x.startsWith('opti-cms:')))

        // Get the base documents
        const documents = clientPreset.prepareDocuments ? 
            await clientPreset.prepareDocuments(outputFilePath, normalDocs) : 
            [...normalDocs, `!${outputFilePath}`]

        // Transform / inject the Opti-CMS documents
        const CmsDocLoaders : Array<Types.CustomDocumentLoader> = 
            (optiDocs.length == 0 ? ['opti-cms:/fragments/13','opti-cms:/queries/13'] : optiDocs).map(optiDoc => {
                const loader: Types.CustomDocumentLoader = {}
                loader[optiDoc] = { loader: "@remkoj/optimizely-graph-functions/loader" }
                return loader
            })

        // Create a new, extended, array
        return [...documents, ...CmsDocLoaders]
    },

    buildGeneratesSection: async (options)  => {
        // Extend the default plugin configuration
        options.config = {
            // Overwriteable defaults
            dedupeFragments: true, // Remove duplicate fragment references
            emitLegacyCommonJSImports: false, //Switch to ESM

            // Provided options
            ...options.config,

            // Enforced settings
            namingConvention: "keep", // Keep casing "as-is" from Optimizely Graph
        }

        // Change the default for fragment masking from 'useFragment' to 
        // 'getFragmentData', in order to prevent issues with code checks for
        // React hooks
        if (options.presetConfig.fragmentMasking !== false) {
            options.presetConfig = {
                ...options.presetConfig,
                fragmentMasking: {
                    unmaskFunctionName: 'getFragmentData',
                    ...(typeof(options.presetConfig?.fragmentMasking) == 'object' ? options.presetConfig?.fragmentMasking : {})
                }
            }
        }

        // Extend the document transforms in order to apply the transformations
        // needed to automatically inject Block, Page & Element fragments
        options.documentTransforms = [
            ...(options.documentTransforms || []),
            {
                name: 'optly-transform',
                transformObject: transform,
                config: {
                    ...options.config,
                    ...pickTransformOptions(options.presetConfig)
                }
            }
        ]

        // The packages contain quite a few utility fragments, however these 
        // can cause errors if there're no Content Types using the types 
        // targeted by these fragments as they won't be available in Optimizely
        // Graph - so we're removing them first
        options.documents = options.documents.map(doc => {
            if (doc.document) {
                const newDocument = visit(doc.document, {
                    FragmentDefinition: {
                        enter: (node) => {
                            if (!options.schema.definitions.some(x => (x.kind == Kind.OBJECT_TYPE_DEFINITION || x.kind == Kind.INTERFACE_TYPE_DEFINITION) && x.name.value == node.typeCondition.name.value)) {
                                if (options.presetConfig.verbose)
                                    console.log(`⚠ Removing fragment ${ node.name.value } from the documents, as its target ${ node.typeCondition.name.value } is not available in the schema`)
                                return null
                            }
                        }
                    }
                })
                return {
                    ...doc,
                    document: newDocument
                }
            }
            return doc
        })

        // Build the preset files
        const section : Array<Types.GenerateOptions> = await clientPreset.buildGeneratesSection(options)
        
        // Add GraphQL Request Client
        section.push({
            filename: `${ options.baseOutputDir}client.ts`,
            pluginMap: {
                "add": AddPlugin,
                "typescript-graphql-request": GraphQLRequestPlugin
            },
            plugins: [
                {
                    add: {
                        content: ["import type * as Schema from \"./graphql\";"]
                    },
                },
                {
                    'typescript-graphql-request': {
                        ...options.config,
                        useTypeImports: true,
                        importOperationTypesFrom: "Schema",
                    }
                }
            ],
            schema: options.schema,
            schemaAst: options.schemaAst,
            config: {
                ...options.config,
            },
            profiler: options.profiler,
            documents: options.documents,
            documentTransforms: options.documentTransforms
        })

        // Add the functions file
        section.push({
            filename: `${ options.baseOutputDir }functions.ts`,
            pluginMap: {
                ['optly-functions']: plugin
            },
            plugins: [
                {
                    ['optly-functions']: {}
                }
            ],
            schema: options.schema,
            schemaAst: options.schemaAst,
            profiler: options.profiler,
            config: {
                ...options.config,
                ...pickPluginOptions(options.presetConfig),
            },
            documents: options.documents,
            documentTransforms: options.documentTransforms
        })

        // Update all sections for Optimizely Graph
        section.forEach((fileConfig, idx) => {
            // Modify index.ts with additional exports
            if (fileConfig.filename.endsWith("index.ts")) {
                section[idx].plugins.unshift({
                    add: {
                        content: [
                            'export * as Schema from "./graphql";',
                            'export * from "./functions";',
                            'export { getSdk, type Sdk } from "./client";',
                        ]
                    }
                })
                section[idx].plugins.push({
                    add: {
                        content: ['',`export const WITH_RECURSIVE_SUPPORT = ${ options.presetConfig.recursion === true ? 'true' : 'false' };`]
                    }
                })
            }

            // Optimizely Graph supports recursive queries to allow fetching
            // data as created in the CMS. This can cause issues when using
            // multiple GraphQL sources, hence the ability to enable/disalbe
            // the support for recursive queries.
            if (fileConfig.skipDocumentsValidation != true && options.presetConfig.recursion === true) {
                const currentOptions = fileConfig.skipDocumentsValidation || {}
                section[idx].skipDocumentsValidation = {
                    ...currentOptions,
                    ignoreRules: [...(currentOptions.ignoreRules ?? []), 'NoFragmentCyclesRule']
                }
            }
        })

        return section
    },
}

export default preset