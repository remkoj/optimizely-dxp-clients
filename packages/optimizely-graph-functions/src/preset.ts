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
            ...options.config,
            namingConvention: "keep", // Keep casing "as-is" from Optimizely Graph
            useTypeImports: true, // Enable type importing to enhance bundling
            skipTypename: true, // Only add __typename if explicitly requested
            avoidOptionals: true, // Don't use TypeScript optionals (?)
            dedupeFragments: true, // Remove duplicates
        }

        if (options.presetConfig.fragmentMasking !== false) {
            options.presetConfig = {
                ...options.presetConfig,
                fragmentMasking: {
                    ...(typeof(options.presetConfig?.fragmentMasking) == 'object' ? options.presetConfig?.fragmentMasking : {}),
                    unmaskFunctionName: 'getFragmentData'
                }
            }
        }

        //Extend the document transforms
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
                        dedupeFragments: false,
                        useTypeImports: true,
                        importOperationTypesFrom: "Schema"
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

        
        section.forEach((fileConfig, idx) => {
            // Modify index.ts with additional exports
            if (fileConfig.filename.endsWith("index.ts")) {
                section[idx].plugins.unshift({
                    add: {
                        content: ['export * as Schema from "./graphql";','export * from "./functions";','export { getSdk, type Sdk } from "./client";']
                    }
                })
            }

            if (options.presetConfig.recursion === true && fileConfig.filename.endsWith('graphql.ts')) {
                section[idx].plugins = fileConfig.plugins.map(plugin => {
                    const pluginName = Object.getOwnPropertyNames(plugin).at(0)
                    switch (pluginName) {
                        case "typed-document-node": {
                            const config = plugin[pluginName]
                            const newPlugin : Types.ConfiguredPlugin = {}
                            newPlugin[pluginName] = {
                                ...config,
                                dedupeFragments: false
                            }
                            return newPlugin
                        }
                    }
                    return plugin
                })
            }

            // Set validation rules
            if (fileConfig.skipDocumentsValidation != true && options.presetConfig.recursion === true) {
                const currentOptions = fileConfig.skipDocumentsValidation || {}
                section[idx].skipDocumentsValidation = {
                    ...currentOptions,
                    ignoreRules: ['NoFragmentCyclesRule']
                }
            }
        })

        const idx = 0
        const output = section.filter(((x,i) => x && i == idx) as <T>(x: T | null | undefined, i: number) => x is T)
        return output
    },
}

export default preset