import type { Types } from '@graphql-codegen/plugin-helpers'
import { parse } from 'graphql'

import * as OptiCMS from '../cms'
import type { PresetOptions } from '../types'
import { getAllQueries, getAllTypeNames } from './tools'
import { isNotNullOrUndefined } from '../utils'
import { VirtualLocation, DocumentGenerator } from '../generator'

export async function getPageDocuments(loader: string = '@remkoj/optimizely-graph-functions/contenttype-loader')
{
  const pageTypes = OptiCMS.getContentTypesList(undefined, (ct) => {
    if (ct.source == "graph")
      return false;
    return ["_page", "_experience"].includes((ct.baseType || "").toLowerCase());
  });

  const documents: Types.CustomDocumentLoader[] = [];
  for (const pageType of await pageTypes) {
    const vLoc = VirtualLocation.build(pageType, { type: 'query' })
    if (vLoc) {
      const def: Types.CustomDocumentLoader = {}
      def[vLoc] = { loader }
      documents.push(def);
    }
    
    // Get properties
    const propertyComponentTypeNames = DocumentGenerator.getReferencedPropertyComponents(pageType);
    const propertyComponentTypes = (await Promise.all(propertyComponentTypeNames.map(componentTypeName => OptiCMS.getContentType(componentTypeName)))).filter(isNotNullOrUndefined)
    for (const propertyComponentType of propertyComponentTypes) {
      const propVLoc = VirtualLocation.build(propertyComponentType, { type: 'fragment', forProperty: true })
      if (propVLoc && !documents.some(x => typeof x === 'object' && x[propVLoc])) {
        // Inject virtual location
        const def: Types.CustomDocumentLoader = {}
        def[propVLoc] = { loader };
        documents.push(def);
      }
    }
  }
  return documents;
}

export async function injectPageQueries(files: Types.DocumentFile[], options: Types.PresetFnArgs<PresetOptions>): Promise<Types.DocumentFile[]> {
  if (options.presetConfig.verbose)
    console.log(`✨ [Optimizely] Generating page queries that have not been defined by the implementation`)

  const existingQueries = getAllQueries(files)
  const existingTypes = getAllTypeNames(options.schema)

  const allTypes = OptiCMS.getContentTypes(undefined);
  const pageLevelTypes = OptiCMS.getContentTypesList(undefined, (ct) => {
    if (ct.source == "graph")
      return false;
    return ["_page", "_experience"].includes((ct.baseType || "").toLowerCase());
  });

  const queryGen = new DocumentGenerator(await allTypes);
  const newFiles: Types.DocumentFile[] = []
  for (const pageContentType of await pageLevelTypes) {
    const graphDataType = queryGen.getGraphType(pageContentType)
    const queryName = queryGen.getDefaultQueryName(pageContentType)

    // Check if the type exists in the Schema, if not skip it
    if (!existingTypes.includes(graphDataType)) {
      if (options.presetConfig.verbose)
        console.log(`    - Skipping query generation for ${pageContentType.key}, the schema does not contain the type ${graphDataType}`)
      continue
    }

    // Check if the query has already been defined, if so skip it
    if (existingQueries.has(queryName)) {
      if (options.presetConfig.verbose)
        console.log(`    - Skipping query generation for ${pageContentType.key}, the project already includes a definition for ${queryName}`)
      continue
    }

    const rawSDL = queryGen.buildGetQuery(pageContentType, queryName)
    const vLoc = VirtualLocation.build(pageContentType, { type: 'query' })
    if (options.presetConfig.verbose)
      console.log(`    - Generated query for ${pageContentType.key} at ${vLoc}`)

    newFiles.push({
      rawSDL,
      document: parse(rawSDL),
      location: vLoc,
      hash: vLoc
    })
  }

  return [...files, ...newFiles]
}

export default injectPageQueries
