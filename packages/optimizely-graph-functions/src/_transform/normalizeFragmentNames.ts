import type { Types } from '@graphql-codegen/plugin-helpers'
import type { FragmentDefinitionNode } from 'graphql'
import { visit, print } from 'graphql'
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
export function normalizeFragmentNames(files: Types.DocumentFile[], options: Types.PresetFnArgs<PresetOptions>): Types.DocumentFile[] {
  if (options.presetConfig.verbose)
    console.log(`✨ [Optimizely] Making all internal fragments available, which have not be overridden by the project`)

  // Filter & rename fragments
  const allFragmentNames = files.reduce<string[]>((list, file) => {
    if (file.document) visit(file.document, {
      FragmentDefinition: {
        enter(node) {
          list.push(node.name.value)
        }
      }
    })
    return list
  }, [])
  const operations = allFragmentNames.reduce<{ toRename: string[], toRemove: string[] }>((prev, fragmentName) => {
    if (fragmentName.startsWith('_')) {
      if (allFragmentNames.includes(fragmentName.substring(1))) {
        prev.toRemove.push(fragmentName)
      } else {
        prev.toRename.push(fragmentName)
      }
    }
    return prev
  }, { toRename: [], toRemove: [] })
  const filteredFiles: Types.DocumentFile[] = files.map(file => {
    let isModified = false;
    const newDocument = file.document ? visit(file.document, {
      FragmentDefinition: {
        enter(node) {
          const nodeName = node.name.value
          if (operations.toRemove.includes(nodeName)) {
            if (options.presetConfig.verbose)
              console.log(`  ⚠ Removing default fragment ${node.name.value.substring(1)} from the documents as it has been overridden.`)
            isModified = true
            return null
          }
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
            } as FragmentDefinitionNode
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