import { type Types } from '@graphql-codegen/plugin-helpers'
import { Kind, visit, print, parse } from 'graphql'
import type { PresetOptions } from '../types'

/**
 * Remove all fragments that target a type that is not present in the Schema
 * 
 * @param files 
 * @param options 
 * @returns 
 */
export function cleanFragments(files: Types.DocumentFile[], options: Types.PresetFnArgs<PresetOptions>): Types.DocumentFile[] {
  return files.map(doc => {
    if (doc.document) {
      let isModified = false
      const newDocument = visit(doc.document, {
        FragmentDefinition: {
          enter: (node) => {
            if (!options.schema.definitions.some(x => (x.kind == Kind.OBJECT_TYPE_DEFINITION || x.kind == Kind.INTERFACE_TYPE_DEFINITION) && x.name.value == node.typeCondition.name.value)) {
              if (options.presetConfig.verbose)
                console.log(`⚠ Removing fragment ${node.name.value} from the documents, as its target ${node.typeCondition.name.value} is not available in the schema`)
              isModified = true
              return null
            }
          }
        }
      })
      return isModified ? {
        ...doc,
        rawSDL: print(newDocument),
        document: newDocument
      } : doc
    }
    return doc
  })
}