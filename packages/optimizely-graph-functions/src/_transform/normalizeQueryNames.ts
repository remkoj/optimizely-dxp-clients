import type { Types } from '@graphql-codegen/plugin-helpers'
import type { FragmentDefinitionNode, OperationDefinitionNode } from 'graphql'
import { visit, print, OperationTypeNode } from 'graphql'
import type { PresetOptions } from '../types'

/**
 * Allows the SDK to define fragments starting with an "_", for which:
 * - If a fragment with the same name, without an "_" exists, will be removed
 * - If such a fragment does not exist, it will be renamed to without a "_"
 * 
 * @param files 
 * @param options 
 * @returns 
 */
export function normalizeQueryNames(files: Types.DocumentFile[], options: Types.PresetFnArgs<PresetOptions>): Types.DocumentFile[] {
  if (options.presetConfig.verbose)
    console.log(`✨ [Optimizely] Making all internal queries available, which have not be overridden by the project`)

  // List all queries
  const allQueryNames = files.reduce<string[]>((list, file) => {
    if (file.document) visit(file.document, {
      OperationDefinition: {
        enter(node) {
          if (node.operation == OperationTypeNode.QUERY && typeof (node.name?.value) == 'string' && node.name.value.length > 0)
            list.push(node.name.value)
        }
      }
    })
    return list
  }, [])

  // Determine the operations for the internal queries
  const operations = allQueryNames.reduce<{ toRename: string[], toRemove: string[] }>((prev, queryName) => {
    if (queryName.startsWith('_')) {
      if (allQueryNames.includes(queryName.substring(1))) {
        prev.toRemove.push(queryName)
      } else {
        prev.toRename.push(queryName)
      }
    }
    return prev
  }, { toRename: [], toRemove: [] })

  // Update documents
  const filteredFiles: Types.DocumentFile[] = files.map(file => {
    let isModified = false;
    const newDocument = file.document ? visit(file.document, {
      OperationDefinition: {
        enter(node) {
          // Only process queries with a name and of operation type Query
          if (node.name && node.operation === OperationTypeNode.QUERY) {
            const nodeName = node.name.value

            // Remove query
            if (operations.toRemove.includes(nodeName)) {
              if (options.presetConfig.verbose)
                console.log(`  ⚠ Removing default query ${node.name.value.substring(1)} from the documents as it has been overridden.`)
              isModified = true
              return null
            }

            // Rename query
            if (operations.toRename.includes(nodeName)) {
              if (options.presetConfig.verbose)
                console.log(`  ⚠ Making default fragment ${node.name.value.substring(1)} available as it has not been overridden.`)
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
    }) : undefined
    return isModified ? {
      ...file,
      rawSDL: newDocument ? print(newDocument) : undefined,
      document: newDocument
    } as Types.DocumentFile : file
  })
  return filteredFiles
}