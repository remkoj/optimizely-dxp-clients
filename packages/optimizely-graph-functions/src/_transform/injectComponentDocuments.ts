import type { Types } from '@graphql-codegen/plugin-helpers'
import { parse } from 'graphql'
import * as QueryGen from '../contenttype-loader'
import * as OptiCMS from '../cms'
import type { PresetOptions } from '../types'
import { getAllFragments, getAllTypeNames } from "./tools"
import { isNotNullOrUndefined } from '../utils'

export async function getComponentDocuments(loader: string = '@remkoj/optimizely-graph-functions/contenttype-loader')
{
  const componentTypes = OptiCMS.getAllContentTypes(undefined, 100, (ct) => {
    return ct.key && ct.source !== 'graph' ? true : false
  });

  const documents: Types.CustomDocumentLoader[] = [];
  for await (const componentType of componentTypes) {
    const vLoc = QueryGen.buildVirtualLocation(componentType, { type: 'fragment', forProperty: false })
    if (vLoc) {
      // Inject virtual location
      const def: Types.CustomDocumentLoader = {}
      def[vLoc] = { loader };
      documents.push(def);

      // Get properties
      const propertyComponentTypeNames = QueryGen.getReferencedPropertyComponents(componentType);
      const propertyComponentTypes = (await Promise.all(propertyComponentTypeNames.map(componentTypeName => OptiCMS.getContentType(componentTypeName)))).filter(isNotNullOrUndefined)
      for (const propertyComponentType of propertyComponentTypes) {
        const propVLoc = QueryGen.buildVirtualLocation(propertyComponentType, { type: 'fragment', forProperty: true })
        if (propVLoc && !documents.some(x => typeof x === 'object' && x[propVLoc])) {
          // Inject virtual location
          const def: Types.CustomDocumentLoader = {}
          def[propVLoc] = { loader };
          documents.push(def);
        }
      }
    }
  }
  return documents;
}

export async function getInjectionTargetDocuments(loader: string = '@remkoj/optimizely-graph-functions/contenttype-loader')
{
  const documents: Types.CustomDocumentLoader[] = [];
  for (const injectionTarget of QueryGen.getInjectionTargets()) {
    const vLoc = QueryGen.buildVirtualLocation(injectionTarget)
    const def: Types.CustomDocumentLoader = {}
    def[vLoc] = { loader };
    documents.push(def);
  }
  return documents
}

export async function injectInjectionTargets(files: Types.DocumentFile[], options: Types.PresetFnArgs<PresetOptions>): Promise<Types.DocumentFile[]> {
  const allFragments = getAllFragments(files)
  const addedFiles: Types.DocumentFile[] = []

  if (options.presetConfig.verbose)
    console.log(`✨ [Optimizely] Generating injection target fragments`)

  for (const injectionTarget of QueryGen.getInjectionTargets()) {
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

  return [...files, ...addedFiles]
}

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
    console.log(`✨ [Optimizely] Generating component fragments that have not been defined by the implementation`)

  const allContentTypes = OptiCMS.getAllContentTypes(options.presetConfig.cmsClient, 100, (ct) => {
    return ct.key && ct.source !== 'graph' ? true : false
  });

  const propTracker: Map<string,string> = new Map()

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
