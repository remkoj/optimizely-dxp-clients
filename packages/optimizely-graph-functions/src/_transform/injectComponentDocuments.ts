import type { Types } from '@graphql-codegen/plugin-helpers'
import { parse } from 'graphql'
import * as QueryGen from '../contenttype-loader'
import * as OptiCMS from '../cms'
import type { PresetOptions } from '../types'
import { getAllFragments, getAllTypeNames } from "./tools"

/**
 * Check all fragments within the project and ensure that there's at least a fragment for every
 * content type defined in Optimizely CMS. This assumes that when overriding the fragments the
 * project will ensure that the injections are correct.
 * 
 * @param files 
 * @param options 
 * @returns 
 */
export async function injectComponentDocuments(files: Types.DocumentFile[], options: Types.PresetFnArgs<PresetOptions>): Promise<Types.DocumentFile[]> {
  const allFragments = getAllFragments(files)
  const allGraphTypes = getAllTypeNames(options.schema)
  const addedFiles: Types.DocumentFile[] = []

  if (options.presetConfig.verbose)
    console.log(`✨ [Optimizely] Generating injection target fragments that have not been defined by the implementation`)

  for (const injectionTarget of Object.getOwnPropertyNames(QueryGen.ContentTypeTarget)) {
    if (!allFragments.some(x => x.fragmentName === injectionTarget)) {
      const vLoc = `opti-cms:/injectiontarget/${injectionTarget}`
      const rawSDL = `fragment ${injectionTarget} on _IContent { ...IContentData }`
      if (options.presetConfig.verbose)
        console.log(`    - Generated fragment ${injectionTarget} at ${vLoc}`)
      addedFiles.push({
        rawSDL,
        document: parse(rawSDL),
        location: vLoc,
        hash: vLoc
      })
    }
  }

  if (options.presetConfig.verbose)
    console.log(`✨ [Optimizely] Generating component fragments that have not been defined by the implementation`)

  const allContentTypes = OptiCMS.getAllContentTypes(options.presetConfig.cmsClient, 100, (ct) => {
    return ct.key && ct.source !== 'graph' ? true : false
  });

  const propTracker: QueryGen.PropertyCollisionTracker = new Map()

  for await (const contentType of allContentTypes) {
    // Skip over content types without a key
    if (!contentType.key)
      continue

    // Construct the type names expected to be in Graph
    const graphType = QueryGen.getGraphType(contentType)
    const graphPropertyType = QueryGen.getGraphPropertyType(contentType)
    const fragmentName = QueryGen.Tools.ucFirst(graphType) + "Data"
    const propertyFragmentName = QueryGen.Tools.ucFirst(graphPropertyType) + "Data"

    // Check if the types exist
    const graphTypeExists = allGraphTypes.includes(graphType)
    const graphPropertyTypeExists = allGraphTypes.includes(graphPropertyType)

    // Add Component Data Fragment
    if (graphTypeExists && !allFragments.has(fragmentName)) {
      const rawSDL = QueryGen.buildFragment(contentType, fragmentName, false, propTracker)
      const vLoc = QueryGen.buildVirtualLocation(contentType)
      if (rawSDL) {
        if (options.presetConfig.verbose)
          console.log(`    - Generated fragment ${fragmentName} for ${contentType.key} at ${vLoc}`)
        addedFiles.push({
          rawSDL,
          document: parse(rawSDL),
          location: vLoc,
          hash: vLoc
        })
      }
    }

    // Add Component Property Data Fragment
    if (graphPropertyTypeExists && contentType.baseType === '_component' && !allFragments.has(propertyFragmentName)) {
      const rawSDL = QueryGen.buildFragment(contentType, propertyFragmentName, true, propTracker)
      const vLoc = QueryGen.buildVirtualLocation(contentType, { forProperty: true })
      if (rawSDL) {
        if (options.presetConfig.verbose)
          console.log(`    - Generated property fragment ${propertyFragmentName} for ${contentType.key} at ${vLoc}`)
        addedFiles.push({
          rawSDL,
          document: parse(rawSDL),
          location: vLoc,
          hash: vLoc
        })
      }
    }
  }

  return [...files, ...addedFiles]
}

export default injectComponentDocuments