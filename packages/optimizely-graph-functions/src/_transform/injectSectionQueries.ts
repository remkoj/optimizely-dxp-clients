import type { Types } from '@graphql-codegen/plugin-helpers'
import { parse } from 'graphql'

import * as OptiCMS from '../cms'
import type { PresetOptions } from '../types'
import { getAllQueries, getAllTypeNames } from './tools'
import { VirtualLocation, DocumentGenerator } from '../generator'

export async function getSectionDocuments(loader: string = '@remkoj/optimizely-graph-functions/contenttype-loader')
{
  const sectionTypes = OptiCMS.getContentTypesList(undefined, (ct) => {
    if (ct.source == "graph")
      return false;
    return ["_section"].includes((ct.baseType || "").toLowerCase());
  });

  const documents: Types.CustomDocumentLoader[] = [];
  for (const sectionType of await sectionTypes) {
    const vLoc = VirtualLocation.build(sectionType, { type: 'query' })
    if (vLoc) {
      const def: Types.CustomDocumentLoader = {}
      def[vLoc] = { loader }
      documents.push(def);
    }
  }
  return documents;
}

export async function injectSectionQueries(files: Types.DocumentFile[], options: Types.PresetFnArgs<PresetOptions>): Promise<Types.DocumentFile[]> {
  if (options.presetConfig.verbose)
    console.log(`✨ [Optimizely] Generating page queries that have not been defined by the implementation`)

  const existingQueries = getAllQueries(files)
  const existingTypes = getAllTypeNames(options.schema)

  const allTypes = OptiCMS.getContentTypes(undefined)
  const sectionTypes = OptiCMS.getContentTypesList(undefined, (ct) => {
    if (ct.source == "graph")
      return false;
    return ["_section"].includes((ct.baseType || "").toLowerCase());
  });

  const newFiles: Types.DocumentFile[] = []
  const queryGen = new DocumentGenerator(await allTypes)
  for (const sectionContentType of await sectionTypes) {
    const graphDataType = queryGen.getGraphType(sectionContentType)
    const queryName = queryGen.getDefaultQueryName(sectionContentType);

    // Check if the type exists in the Schema, if not skip it
    if (!existingTypes.includes(graphDataType)) {
      if (options.presetConfig.verbose)
        console.log(`    - Skipping query generation for ${sectionContentType.key}, the schema does not contain the type ${graphDataType}`)
      continue
    }

    // Check if the query has already been defined, if so skip it
    if (existingQueries.has(queryName)) {
      if (options.presetConfig.verbose)
        console.log(`    - Skipping query generation for ${sectionContentType.key}, the project already includes a definition for ${queryName}`)
      continue
    }

    const rawSDL = queryGen.buildGetQuery(sectionContentType, queryName)
    const vLoc = VirtualLocation.build(sectionContentType, { type: 'query' })
    if (options.presetConfig.verbose)
      console.log(`    - Generated query for ${sectionContentType.key} at ${vLoc}`)

    newFiles.push({
      rawSDL,
      document: parse(rawSDL),
      location: vLoc,
      hash: vLoc
    })
  }

  return [...files, ...newFiles]
}

export default injectSectionQueries
