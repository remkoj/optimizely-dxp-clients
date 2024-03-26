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
const client_preset_1 = require("@graphql-codegen/client-preset");
const index_1 = __importStar(require("./index"));
const transform_1 = __importStar(require("./transform"));
exports.preset = {
    prepareDocuments: async (outputFilePath, outputSpecificDocuments) => {
        const documents = client_preset_1.preset.prepareDocuments ? await client_preset_1.preset.prepareDocuments(outputFilePath, outputSpecificDocuments) : [...outputSpecificDocuments, `!${outputFilePath}`];
        documents.push([...documents_1.fragments, ...documents_1.queries].join("\n"));
        return documents;
    },
    buildGeneratesSection: async (options) => {
        options.documentTransforms = [
            {
                name: 'optly-transform',
                transformObject: transform_1.default,
                config: (0, transform_1.pickTransformOptions)(options.presetConfig)
            }
        ];
        const section = await client_preset_1.preset.buildGeneratesSection(options);
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
            config: (0, index_1.pickPluginOptions)(options.presetConfig),
            documents: options.documents,
            documentTransforms: options.documentTransforms
        });
        section.forEach((fileConfig, idx) => {
            if (fileConfig.filename.endsWith("index.ts")) {
                const currentContent = section[idx].plugins[0]?.add?.content;
                if (currentContent)
                    section[idx].plugins[0].add.content = `export * as Schema from "./graphql";\n${currentContent}\nexport * from "./functions";`;
            }
        });
        return section;
    },
};
exports.default = exports.preset;
//# sourceMappingURL=preset.js.map