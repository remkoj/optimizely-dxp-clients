import type { PluginValidateFn, CodegenPlugin, PluginFunction } from '@graphql-codegen/plugin-helpers'
import { print } from 'graphql'

export type DocumentAstPluginOptions = object; //{}

/**
 * Plugin function: concatenates the printed SDL of all provided documents into
 * a single string, separated by blank lines. Useful for dumping the final
 * transformed document set to a file for inspection.
 */
const plugin: PluginFunction<DocumentAstPluginOptions, string> = async (schema, documents) => {
  return "\n" + documents.map(document => document.document ? print(document.document) : undefined).filter(Boolean).join("\n\n")
}

/** Validation function: ensures at least one document with a parseable AST is present. */
const validate: PluginValidateFn<DocumentAstPluginOptions> = (schema, documents/*, config, output, allPlugins, pluginContext*/) => {
  if (documents.filter(d => d.document).length < 1)
    throw new Error("Document-AST requires at least one document that can be printend")
}

module.exports = { plugin, validate } as CodegenPlugin<DocumentAstPluginOptions>