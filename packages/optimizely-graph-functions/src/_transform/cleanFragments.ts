import { type Types } from '@graphql-codegen/plugin-helpers'
import { Kind, visit, print, type DocumentNode } from 'graphql'
import type { PresetOptions } from '../types'
import { isOptiCmsURL } from '../generator/virtual-location'

/**
 * Remove all fragments that target a type that is not present in the Schema.
 * Only processes `opti-cms:/` virtual documents; user-authored files are left untouched.
 */
export function cleanFragments(files: Types.DocumentFile[], schema: DocumentNode, options: PresetOptions): Types.DocumentFile[] {
  let fragmentRemovalCounter = 0;
  const updatedFiles = files.map(doc => {
    if (!isOptiCmsURL(doc.location) || !doc.document)
      return doc;
    let isModified = false
    const newDocument = visit(doc.document, {
      FragmentDefinition: {
        enter: (node) => {
          if (!schema.definitions.some(x => (x.kind == Kind.OBJECT_TYPE_DEFINITION || x.kind == Kind.INTERFACE_TYPE_DEFINITION) && x.name.value == node.typeCondition.name.value)) {
            if (options.verbose)
              console.log(`❌ [Optimizely] Removing fragment ${node.name.value} from the documents, as its target ${node.typeCondition.name.value} is not available in the schema`)
            isModified = true
            fragmentRemovalCounter++;
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
  });
  if (options.verbose)
    console.log(`✨ [Optimizely] Removed ${ fragmentRemovalCounter } fragment(s) that target non-existing types from the documents`)
  return updatedFiles;
}