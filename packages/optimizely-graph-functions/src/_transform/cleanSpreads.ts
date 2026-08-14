import { type Types } from '@graphql-codegen/plugin-helpers'
import { visit, print, type DocumentNode } from 'graphql'
import { getAllFragments, isFragmentOrOperation } from './tools'
import { PresetOptions } from '../types'
import { isOptiCmsURL } from '../generator/virtual-location'

/**
 * Remove all fragment spreads that target non-existing fragments from `opti-cms:/` documents.
 * Fragment existence is checked across all files; only virtual documents are mutated.
 */
export function cleanFragmentSpreads(files: Types.DocumentFile[], schema: DocumentNode, options: PresetOptions): Types.DocumentFile[] {
  const allFragments = getAllFragments(files)
  let removedSpreadCounter = 0;
  const updatedDocuments = files.map(file => {
    if (!isOptiCmsURL(file.location) || !file.document)
      return file;

    let isModified: boolean = false;
    const newDocument = visit(file.document, {
      FragmentSpread: {
        enter: (node, key, parent, path, ancestors) => {// Get the parent name
          const parentName = [...ancestors].reverse().filter(isFragmentOrOperation).at(0)?.name?.value
          if (!allFragments.some(x => x.fragmentName === node.name.value)) {
            if (options.verbose)
              console.log(`❌ [Optimizely] Removing spread of ${ node.name.value } from ${ parentName } as the fragment does not exist`);
            removedSpreadCounter++;
            isModified = true;
            return null;
          }
        }
      }
    });

    return isModified ? {
      ...file,
      rawSDL: print(newDocument),
      document: newDocument
    } : file
  });
  if (options.verbose)
    console.log(`✨ [Optimizely] Removed ${ removedSpreadCounter } fragment spread(s) that target non-existing fragments from the documents`)

  return updatedDocuments;
}