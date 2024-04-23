"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.preset = void 0;
const documents_1 = require("./documents");
// Import base preset
const client_preset_1 = require("@graphql-codegen/client-preset");
const GraphQLRequestPlugin = __importStar(require("@graphql-codegen/typescript-graphql-request"));
const AddPlugin = __importStar(require("@graphql-codegen/add"));
// Import injected parts
const index_1 = __importStar(require("./index"));
const transform_1 = __importStar(require("./transform"));
exports.preset = {
    /**
     * Prepare the documents to be parsed by this preset, without modifying the original array
     *
     * @param       outputFilePath              The path where the output of this preset will be stored
     * @param       outputSpecificDocuments     The currently selected documents
     * @returns     An awaitable with the modified list of documents.
     */
    prepareDocuments: async (outputFilePath, outputSpecificDocuments) => {
        // Get the base documents
        const documents = client_preset_1.preset.prepareDocuments ?
            await client_preset_1.preset.prepareDocuments(outputFilePath, outputSpecificDocuments) :
            [...outputSpecificDocuments, `!${outputFilePath}`];
        // Create a new, extended, array
        return [...documents, ...documents_1.fragments, ...documents_1.queries];
    },
    buildGeneratesSection: async (options) => {
        // Extend the document transforms
        options.config = {
            ...options.config,
            namingConvention: "keep", // Keep casing "as-is" from Optimizely Graph
        };
        options.documentTransforms = [
            ...(options.documentTransforms || []),
            {
                name: 'optly-transform',
                transformObject: transform_1.default,
                config: (0, transform_1.pickTransformOptions)(options.presetConfig)
            }
        ];
        // Build the preset files
        const section = await client_preset_1.preset.buildGeneratesSection(options);
        // Add GraphQL Request Client
        section.push({
            filename: `${options.baseOutputDir}client.ts`,
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
        });
        // Add the functions file
        section.push({
            filename: `${options.baseOutputDir}functions.ts`,
            pluginMap: {
                ['optly-functions']: index_1.default
            },
            plugins: [
                {
                    ['optly-functions']: {}
                }
            ],
            schema: options.schema,
            schemaAst: options.schemaAst,
            profiler: options.profiler,
            config: (0, index_1.pickPluginOptions)(options.presetConfig),
            documents: options.documents,
            documentTransforms: options.documentTransforms
        });
        // Add functions to index plugin
        section.forEach((fileConfig, idx) => {
            if (fileConfig.filename.endsWith("index.ts")) {
                section[idx].plugins.unshift({
                    add: {
                        content: ['export * as Schema from "./graphql";', 'export * from "./functions";', 'export { getSdk, type Sdk } from "./client";']
                    }
                });
            }
        });
        return section;
    },
};
exports.default = exports.preset;
//# sourceMappingURL=preset.js.map