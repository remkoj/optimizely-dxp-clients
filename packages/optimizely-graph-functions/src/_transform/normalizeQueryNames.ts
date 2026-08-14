import type { Types } from '@graphql-codegen/plugin-helpers'
import type { DocumentNode, OperationDefinitionNode } from 'graphql'
import { visit, print, OperationTypeNode } from 'graphql'
import type { PresetOptions } from '../types'
import { isOptiCmsURL } from '../generator/virtual-location'

/**
 * Allows the SDK to define queries starting with an `_`, for which:
 * - If a query with the same name, without the `_`, exists, the SDK default is removed.
 * - If no such override exists, the `_`-prefixed query is renamed to drop the prefix.
 *
 * This lets the SDK ship default built-in queries while still allowing projects to
 * override them by defining a query with the same name (without the `_`).
 *
 * @param files   The current document set
 * @param options Preset arguments (verbose flag is read from `options.presetConfig`)
 * @returns       Updated document set with internal query names resolved
 */
export function normalizeQueryNames(files: Types.DocumentFile[], schema: DocumentNode, options: PresetOptions): Types.DocumentFile[] {
  // List all queries
  const allQueryNames = files.reduce<{query: string, location: string|undefined}[]>((list, file) => {
    if (file.document) visit(file.document, {
      OperationDefinition: {
        enter(node) {
          if (node.operation == OperationTypeNode.QUERY && typeof (node.name?.value) == 'string' && node.name.value.length > 0)
            list.push({query: node.name.value, location: file.location})
        }
      }
    })
    return list
  }, [])

  // Determine the operations for the internal queries
  const operations = allQueryNames.reduce<{ toRename: string[], toRemove: string[] }>((prev, query) => {
    const { query: queryName, location } = query;
    if (queryName.startsWith('_') && isOptiCmsURL(location)) {
      if (allQueryNames.find(x => x.query === queryName.substring(1))) {
        prev.toRemove.push(queryName)
      } else {
        prev.toRename.push(queryName)
      }
    }
    return prev
  }, { toRename: [], toRemove: [] })

  // Update documents
  const filteredFiles: Types.DocumentFile[] = files.map(file => {
    if (!file.document) return file;
    let isModified = false;
    const newDocument = visit(file.document, {
      OperationDefinition: {
        enter(node) {
          // Only process queries with a name and of operation type Query
          if (node.name && node.operation === OperationTypeNode.QUERY) {
            const nodeName = node.name.value

            // Remove query
            if (operations.toRemove.includes(nodeName)) {
              isModified = true
              return null
            }

            // Rename query
            if (operations.toRename.includes(nodeName)) {
              isModified = true
              return {
                ...node,
                name: {
                  ...node.name,
                  value: nodeName.substring(1)
                }
              } as OperationDefinitionNode
            }
          }
        }
      }
    });
    return isModified ? {
      ...file,
      rawSDL: print(newDocument),
      document: newDocument
    } as Types.DocumentFile : file
  })

  if (options.verbose) {
    console.log(`✅ [Optimizely] Identified ${ operations.toRemove.length } overridden queries, keeping ${ operations.toRename.length } built-in queries`);
    if (operations.toRemove.length > 0)
      console.log(`                Overridden queries: ${ operations.toRemove.map(x => x.startsWith('_') ? x.substring(1) : x).join(", ") }`)
  }

  return filteredFiles
}