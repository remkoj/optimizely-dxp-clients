import type { Types } from '@graphql-codegen/plugin-helpers'
import { parse } from 'graphql'
import * as QueryGen from '../contenttype-loader'
import * as OptiCMS from '../cms'
import type { PresetOptions } from '../types'
import { getAllQueries, getAllTypeNames } from './tools'

export async function injectSectionQueries(files: Types.DocumentFile[], options: Types.PresetFnArgs<PresetOptions>): Promise<Types.DocumentFile[]> {
  if (options.presetConfig.verbose)
    console.log(`✨ [Optimizely] Generating page queries that have not been defined by the implementation`)

  const existingQueries = getAllQueries(files)
  const existingTypes = getAllTypeNames(options.schema)

  const sectionTypes = OptiCMS.getAllContentTypes(undefined, 100, (ct) => {
    if (ct.source == "graph")
      return false;
    return ["_section"].includes((ct.baseType || "").toLowerCase());
  });

  const newFiles: Types.DocumentFile[] = []
  for await (const sectionContentType of sectionTypes) {
    const graphDataType = QueryGen.getGraphType(sectionContentType)
    const queryName = `get${QueryGen.Tools.ucFirst(graphDataType)}Data`

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

    const rawSDL = QueryGen.buildGetQuery(sectionContentType, queryName)
    const vLoc = QueryGen.buildVirtualLocation(sectionContentType, { type: 'query' })
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