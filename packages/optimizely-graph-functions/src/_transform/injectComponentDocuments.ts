import type { Types } from '@graphql-codegen/plugin-helpers'
import { IntegrationApi } from '@remkoj/optimizely-cms-api'
import { Kind, visit, parse } from 'graphql'
import * as QueryGen from '../contenttype-loader'
import * as OptiCMS from '../cms'
import type { PresetOptions } from '../types'

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
  const allFragments = files.reduce<{ fragmentName: string, targetType: string }[]>((list, file) => {
    if (file.document) visit(file.document, {
      FragmentDefinition: {
        enter(node) {
          list.push({
            fragmentName: node.name.value,
            targetType: node.typeCondition.name.value
          })
        }
      }
    })
    return list
  }, [])

  const addedFiles: Types.DocumentFile[] = []
  const allContentTypes = OptiCMS.getAllContentTypes(options.presetConfig.cmsClient, 50);
  for await (const contentType of allContentTypes) {
    if (!contentType.key || contentType.source === 'graph' || contentType.source === "_system")
      continue; // Don't process Graph and internal types

    const graphType = QueryGen.getGraphType(contentType)
    const graphPropertyType = graphType + "Property"

    const graphTypeExists = options.schema.definitions.some(x => (x.kind == Kind.OBJECT_TYPE_DEFINITION || x.kind == Kind.INTERFACE_TYPE_DEFINITION) && x.name.value == graphType)
    const graphPropertyTypeExists = options.schema.definitions.some(x => (x.kind == Kind.OBJECT_TYPE_DEFINITION || x.kind == Kind.INTERFACE_TYPE_DEFINITION) && x.name.value == graphPropertyType)

    // Add Component Data Fragment
    if (graphTypeExists && !allFragments.some(x => x.targetType == graphType)) {
      const rawSDL = QueryGen.buildFragment(contentType, "Data", "", false)
      const vLoc = buildVirtualLocation(contentType)
      if (rawSDL) {
        if (options.presetConfig.verbose)
          console.log(`Generated fragment for ${contentType.key} at ${vLoc}`)
        addedFiles.push({
          rawSDL,
          document: parse(rawSDL),
          location: vLoc,
          hash: vLoc
        })
      }
    }

    // Add Component Property Data Fragment
    if (graphPropertyTypeExists && contentType.baseType === '_component' && !allFragments.some(x => x.targetType == graphPropertyType)) {
      const rawSDL = QueryGen.buildFragment(contentType, "PropertyData", "", true)
      const vLoc = buildVirtualLocation(contentType, true)
      if (rawSDL) {
        if (options.presetConfig.verbose)
          console.log(`Generated property fragment for ${contentType.key} at ${vLoc}`)
        addedFiles.push({
          rawSDL,
          document: parse(rawSDL),
          location: vLoc,
          hash: vLoc
        })
      }
    }

    // Add Component Data Query
    if (contentType.baseType === '_page' || contentType.baseType === '_experience') {
      
    }
  }

  return [...files, ...addedFiles]
}

export function buildVirtualLocation(contentType: IntegrationApi.ContentType, forProperty: boolean = false) {
  const ctKey = contentType.key
  if (!ctKey || contentType.source === 'graph' || contentType.source === '_system')
    return undefined
  const baseType = QueryGen.extractBaseType(contentType)

  return forProperty ?
    `opti-cms:/contenttypes/${baseType}.property/${ctKey}` :
    `opti-cms:/contenttypes/${baseType}/${ctKey}/${QueryGen.getContentTypeTargets(contentType).join('/')}`
}

export default injectComponentDocuments