import type { PluginValidateFn, CodegenPlugin, PluginFunction, Types } from '@graphql-codegen/plugin-helpers'
import { concatAST, getOperationAST, visit, print, OperationTypeNode } from 'graphql'
//import { isNotNullOrUndefined } from './utils'

export type DocumentAstPluginOptions = {}


/**
 * @type { import('@graphql-codegen/plugin-helpers').PluginFunction<{}, string> }
 */
const plugin: PluginFunction<DocumentAstPluginOptions, string> = async (schema, documents) => {
  return "\n" + documents.map(document => document.document ? print(document.document) : undefined).filter(Boolean).join("\n\n")
}

const validate: PluginValidateFn<DocumentAstPluginOptions> = (schema, documents, config, output, allPlugins, pluginContext) => {
  if (documents.filter(d => d.document).length < 1)
    throw new Error("Document-AST requires at least one document that can be printend")
}

module.exports = { plugin, validate } as CodegenPlugin<DocumentAstPluginOptions>