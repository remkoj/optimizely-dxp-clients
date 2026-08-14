import type { CodegenPlugin, PluginFunction, PluginValidateFn } from '@graphql-codegen/plugin-helpers'
import { concatAST, getOperationAST, visit, print, OperationTypeNode, type DefinitionNode, type DocumentNode, type FragmentDefinitionNode } from 'graphql'
import { isNotNullOrUndefined } from './utils'

import type { PluginOptions } from './types'
export type { PluginOptions } from './types'

/** The query names exposed as typed functions when the `functions` preset option is not set. */
export const DefaultFunctions = ['getContentByPath', 'getContentById']

/**
 * Extract and normalise plugin options from a raw preset config object,
 * applying defaults for any properties that are absent.
 *
 * @param options  Raw preset config (typically `options.presetConfig` from the codegen runner)
 * @returns        Normalised `PluginOptions`
 */
export function pickPluginOptions(options: Record<string, unknown>): PluginOptions {
  return {
    ...(options.config ?? {}),
    functions: (options as PluginOptions).functions ?? DefaultFunctions,
    prettyPrintQuery: (options as PluginOptions).prettyPrintQuery ?? false,
    clientPath: (options as PluginOptions).clientPath ?? "./graphql"
  }
}

/**
 * Validate the plugin configuration before codegen runs.
 * Throws if `functions` is provided but is not an array of non-empty strings.
 */
export const validate: PluginValidateFn<PluginOptions> = (schema, document, config) => {
  if (config.functions) {
    if (!Array.isArray(config.functions))
      throw new Error("If provided functions must be an array")

    if (config.functions.some(x => typeof (x) != 'string' || x.length == 0))
      throw new Error("If provided functions must only contain non-empty strings")
  }
}

/**
 * Generate typed wrapper functions for each named query listed in `config.functions`.
 * Each function accepts a `GraphQLClient` and typed variables, and returns a typed promise.
 * Queries are inlined as gql template literals with their transitive fragment dependencies.
 */
export const plugin: PluginFunction<PluginOptions> = async (schema, documents, config) => {
  // Read the functions to fully build & extend
  const functions = config.functions || []
  if (functions.length == 0)
    return `// NO FUNCTIONS TO BE EXPORTED
export const EXPORTED_FUNCTIONS = 0;`

  // Output the functions
  const docs = concatAST(documents.map(x => x.document).filter(isNotNullOrUndefined))
  const output = functions.map(fn => {
    try {
      const queryNode = getOperationAST(docs, fn)
      if (!(queryNode && queryNode.operation == OperationTypeNode.QUERY))
        return [`export async function ${fn}() { throw new Error('No query named ${fn} defined')}`]

      const fragments = resolveSpreads(queryNode, docs)

      const fnTypeName = fn //.charAt(0).toUpperCase() + fn.slice(1)
      const varsType = `Types.${fnTypeName}QueryVariables`
      const returnType = `Types.${fnTypeName}Query`

      const query = [queryNode, ...fragments].map(node => print(node)).join("\n\n")

      const functionBody: string[] = []
      functionBody.push(`export function ${fn}(client: GraphQLClient, variables: ${varsType}) : Promise<${returnType}>`)
      functionBody.push('{')
      functionBody.push(`  const query = gql\`${config.prettyPrintQuery ? query : query.replace(/\s+/g, ' ').trim()}\``)
      functionBody.push(`  return client.request<${returnType}, ${varsType}>(query, variables)`)
      functionBody.push('}')
      return functionBody

    } catch {
      return [`export async function ${fn}() { throw new Error('Function generation error')}`]
    }
  }).flat()

  const prepend: string[] = []
  const append: string[] = []

  prepend.push('import { gql, type GraphQLClient } from \'graphql-request\'')
  prepend.push(`import type * as Types from './graphql'`)
  prepend.push("\n")

  append.push("\n")
  append.push(`export const EXPORTED_FUNCTIONS = ${ functions.length };`)
  append.push("\n")

  return { prepend, content: output.join("\n"), append }
}

/**
 * Recursively collect all `FragmentDefinitionNode`s transitively required by `definition`.
 * Already-resolved fragment names are tracked in `availableFragments` to prevent infinite loops.
 *
 * @param definition         The operation or fragment whose spreads should be resolved
 * @param document           The full document to search for fragment definitions
 * @param availableFragments Names already resolved in an outer recursion level
 * @returns                  Ordered list of required fragment definitions
 */
function resolveSpreads(definition: DefinitionNode, document: DocumentNode, availableFragments: string[] = []): FragmentDefinitionNode[] {
  // Collect the fragment names we need to add
  const spreadNames: string[] = []
  visit(definition, {
    "FragmentSpread": {
      leave(node) {
        if (!availableFragments.includes(node.name.value))
          spreadNames.push(node.name.value)
      }
    }
  })

  // Collect these fragments from the document
  const fragments: FragmentDefinitionNode[] = []
  visit(document, {
    FragmentDefinition: {
      leave(node) {
        if (spreadNames.includes(node.name.value))
          fragments.push(node)
      }
    }
  })

  // Recurse down the fragments to build the full query
  const dependencies: FragmentDefinitionNode[] = []
  const availableFragmentNames = [...availableFragments, ...fragments.map(x => x.name.value)]
  fragments.forEach(fragment => {
    // Set the available names based on what was previously available, loaded above and loaded within this loop
    const resolvedSpreads = [...availableFragmentNames, ...dependencies.map(x => x.name.value)]

    // Recurse into fragments
    const fragmentDependencies = resolveSpreads(fragment, document, resolvedSpreads)
    dependencies.push(...fragmentDependencies)
  })
  return [...fragments, ...dependencies]
}

export default { validate, plugin } as CodegenPlugin<PluginOptions>
