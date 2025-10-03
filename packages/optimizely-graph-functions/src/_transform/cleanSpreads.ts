import { type Types } from '@graphql-codegen/plugin-helpers'
import { Kind, visit, print, parse } from 'graphql'
import type { PresetOptions } from '../types'
import { getAllFragments } from './tools'

/**
 * Remove all fragment spreads that target non-existing fragments from the documents.
 * 
 * @param files 
 * @param options 
 * @returns 
 */
export function cleanFragmentSpreads(files: Types.DocumentFile[], options: Types.PresetFnArgs<PresetOptions>): Types.DocumentFile[] {
  const allFragments = getAllFragments(files)
  return files.map(file => {
    if (!file.document)
      return file;

    let isModified: boolean = false;
    const newDocument = visit(file.document, {
      FragmentSpread: {
        enter: (node) => {
          if (!allFragments.some(x => x.fragmentName === node.name.value)) {
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
  })
}