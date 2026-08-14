import type { Types } from '@graphql-codegen/plugin-helpers'
import type { FragmentDefinitionNode } from 'graphql'
import { visit, print, type DocumentNode } from 'graphql'
import type { PresetOptions } from '../types'
import { isOptiCmsURL } from '../generator/virtual-location'

/**
 * Allows the SDK to define fragments starting with an `_`, for which:
 * - If a fragment with the same name, without the `_`, exists, the SDK default is removed.
 * - If no such override exists, the `_`-prefixed fragment is renamed to drop the prefix.
 *
 * This lets the SDK ship default built-in fragments while still allowing projects to
 * override them by defining a fragment with the same name (without the `_`).
 *
 * @param files   The current document set
 * @param options Preset arguments (verbose flag is read from `options.presetConfig`)
 * @returns       Updated document set with internal fragment names resolved
 */
export function normalizeFragmentNames(files: Types.DocumentFile[], schema: DocumentNode, options: PresetOptions): Types.DocumentFile[] {
  // Filter & rename fragments
  const allFragmentNames = files.reduce<{fragment: string, location: string|undefined}[]>((list, file) => {
    if (file.document) visit(file.document, {
      FragmentDefinition: {
        enter(node) {
          list.push({fragment: node.name.value, location: file.location})
        }
      }
    })
    return list
  }, [])
  const operations = allFragmentNames.reduce<{ toRename: string[], toRemove: string[] }>((prev, fragment) => {
    const { fragment: fragmentName, location } = fragment;
    if (fragmentName.startsWith('_') && isOptiCmsURL(location)) {
      if (allFragmentNames.find(x => x.fragment === fragmentName.substring(1))) {
        prev.toRemove.push(fragmentName)
      } else {
        prev.toRename.push(fragmentName)
      }
    }
    return prev
  }, { toRename: [], toRemove: [] })
  
  const filteredFiles: Types.DocumentFile[] = files.map(file => {
    if (!file.document)
      return file;
    let isModified = false;
    const newDocument = visit(file.document, {
      FragmentDefinition: {
        enter(node) {
          const nodeName = node.name.value
          if (operations.toRemove.includes(nodeName)) {
            //if (options.verbose)
            //  console.log(`  ⚠ Removing default fragment ${node.name.value.substring(1)} from the documents as it has been overridden.`)
            isModified = true
            return null
          }
          if (operations.toRename.includes(nodeName)) {
            //if (options.verbose)
            //  console.log(`  ⚠ Making default fragment ${node.name.value.substring(1)} available as it has not been overridden.`)
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
    })
    return isModified ? {
      ...file,
      rawSDL: print(newDocument),
      document: newDocument
    } : file
  })

  if (options.verbose) {
    console.log(`✅ [Optimizely] Identified ${ operations.toRemove.length } overridden fragments, keeping ${ operations.toRename.length } built-in fragments`);
    if (operations.toRemove.length > 0)
      console.log(`                Overridden fragments: ${ operations.toRemove.map(x => x.startsWith('_') ? x.substring(1) : x).join(", ") }`)
  }

  return filteredFiles
}
