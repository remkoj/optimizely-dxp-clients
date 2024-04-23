import { type Types, normalizeConfig } from '@graphql-codegen/plugin-helpers'
import { fragments, queries } from './documents'

// Import base preset
import { preset as clientPreset, type ClientPresetConfig as ClientPresetOptions } from '@graphql-codegen/client-preset'
import * as GraphQLRequestPlugin from '@graphql-codegen/typescript-graphql-request'
import * as AddPlugin from '@graphql-codegen/add'

// Import injected parts
import plugin, { pickPluginOptions, type PluginOptions } from './index'
import transform, { pickTransformOptions, type TransformOptions } from './transform'

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
        // Get the base documents
        const documents = clientPreset.prepareDocuments ? 
            await clientPreset.prepareDocuments(outputFilePath, outputSpecificDocuments as Array<Types.OperationDocument>) : 
            [...outputSpecificDocuments, `!${outputFilePath}`]

        // Create a new, extended, array
        return [...documents, ...fragments, ...queries]
    },

    buildGeneratesSection: async (options)  => {
        // Extend the document transforms
        options.config = {
            ...options.config,
            namingConvention: "keep", // Keep casing "as-is" from Optimizely Graph
        }
        options.documentTransforms = [
            ...(options.documentTransforms || []),
            {
                name: 'optly-transform',
                transformObject: transform,
                config: pickTransformOptions(options.presetConfig)
            }
        ]

        // Build the preset files
        const section = await clientPreset.buildGeneratesSection(options)
        
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
                        pureMagicComment: true,
                        useTypeImports: true,
                        dedupeFragments: true,
                        importOperationTypesFrom: "Schema"
                    }
                }
            ],
            schema: options.schema,
            schemaAst: options.schemaAst,
            config: options.config,
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
            config: pickPluginOptions(options.presetConfig),
            documents: options.documents,
            documentTransforms: options.documentTransforms
        })

        // Add functions to index plugin
        section.forEach((fileConfig, idx) => {
            if (fileConfig.filename.endsWith("index.ts")) {
                section[idx].plugins.unshift({
                    add: {
                        content: ['export * as Schema from "./graphql";','export * from "./functions";','export { getSdk, type Sdk } from "./client";']
                    }
                })
            }
        })

        return section
    },
}

export default preset