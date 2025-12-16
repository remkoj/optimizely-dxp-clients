import { type Types } from '@graphql-codegen/plugin-helpers'
import type { TransformOptions } from './types'
import type { FragmentDefinitionNode, SelectionNode, SelectionSetNode, ASTNode, OperationDefinitionNode, FragmentSpreadNode } from 'graphql'
import { Kind, visit } from 'graphql'

export { cleanFragments } from "./_transform/cleanFragments"
export { injectComponentDocuments, getComponentDocuments, injectInjectionTargets, getInjectionTargetDocuments } from "./_transform/injectComponentDocuments"
export { normalizeFragmentNames } from "./_transform/normalizeFragmentNames"
export { normalizeQueryNames } from "./_transform/normalizeQueryNames"
export { pickTransformOptions } from "./_transform/options"
export { injectPageQueries, getPageDocuments } from "./_transform/injectPageQueries"
export { injectSectionQueries, getSectionDocuments } from "./_transform/injectSectionQueries"
export { performInjections } from "./_transform/performInjections"
export { cleanFragmentSpreads } from "./_transform/cleanSpreads"
export { handleDependDirective } from "./_transform/handleDependDirective"

export type TransformFn<T = any> = (files: Types.DocumentFile[], options: Types.PresetFnArgs<T>) => Promise<Types.DocumentFile[]> | Types.DocumentFile[]
export async function executeDocumentTransforms<T = any>(files: Types.DocumentFile[], transforms: Array<TransformFn<T>>, options: Types.PresetFnArgs<T>): Promise<Types.DocumentFile[]> {
  let transformedFiles = files;
  for (const transform of transforms)
    transformedFiles = await transform(transformedFiles, options);
  return transformedFiles;
}

import { defaultOptions } from "./_transform/options"
import { getComponentFragments } from "./_transform/performInjections"

export const transform: Types.DocumentTransformFunction<TransformOptions> = async ({ documents: files, config, schema, pluginContext }) => {
  // Create context
  const transformConfig: Readonly<Required<TransformOptions>> = { ...defaultOptions, ...config }
  if (transformConfig.verbose)
    console.debug(`[ OPTIMIZELY ] Starting Optimizely Graph Query & Fragment transformations`)

  // Process all documents to extract the fragments that must be injected
  const componentFragments = await getComponentFragments(files, transformConfig);

  // Get the names we actually need to inject into, and return when none are present
  const intoNames: string[] = Array.from(componentFragments.keys());
  if (intoNames.length == 0) return files
  if (config.verbose)
    intoNames.forEach(intoName => {
      console.debug(`[ OPTIMIZELY ] Update queries & fragments using the fragment ${intoName} to also use the fragments: ${(componentFragments.get(intoName) ?? []).map(x => x.name).join(',')}`)
    })

  // Update the documents
  const transformedFiles = files.map(file => {
    if (config.verbose)
      console.debug(`[ OPTIMIZELY ] Processing ${file.location}`)

    const document = file.document ? visit(file.document, {
      // Replace the fragment occurances
      SelectionSet: {
        leave(node, key, parent, path, ancestors) {
          const parentName = [...ancestors].reverse().filter(isFragmentOrOperation).at(0)?.name?.value
          const sectionsToAdd = node.selections
            .map(selection => {
              if (selection.kind != Kind.FRAGMENT_SPREAD)
                return undefined
              const testableName = config.recursion && selection.name.value.startsWith('Recursive') ? selection.name.value.substring(9) : selection.name.value
              if (config.recursion && config.verbose && testableName != selection.name.value)
                console.debug(`[ OPTIMIZELY ] Using ${selection.name.value} in ${parentName} as ${testableName} to allow recursion`)
              return intoNames.includes(testableName) ? testableName : undefined
            })
            .filter(isNotNullOrUndefined)
          if (sectionsToAdd.length == 0) return

          if (config.verbose)
            console.debug(`[ OPTIMIZELY ] Identified usage of fragment(s) ${sectionsToAdd.join(', ')} in ${parentName}, starting injection procedure`)


          const newSelections: SelectionNode[] = [] //.filter(selection => !(selection.kind == Kind.FRAGMENT_SPREAD && intoNames.includes(selection.name.value)))
          sectionsToAdd.forEach(sectionName => {
            const addedSelections: FragmentSpreadNode[] = (componentFragments.get(sectionName) ?? []).map(fragment => {
              if (newSelections.some(selection => selection.kind == Kind.FRAGMENT_SPREAD && selection.name.value == fragment.name)) {
                if (config.verbose)
                  console.debug(`[ OPTIMIZELY ] Fragment ${fragment.name} is already adjacent to ${sectionName}`)
                return undefined
              }
              /*if (config.verbose) 
                  console.debug(`[ OPTIMIZELY ] Adding fragment ${ fragment.name.value } adjacent to ${ sectionName }`)*/
              return {
                kind: Kind.FRAGMENT_SPREAD,
                directives: [],
                name: {
                  kind: Kind.NAME,
                  value: fragment.name
                }
              } as FragmentSpreadNode
            }).filter(isNotNullOrUndefined)
            if (addedSelections.length > 0) {
              if (config.verbose)
                console.log(`[ OPTIMIZELY ] Added fragments ${addedSelections.map(a => a.name.value).join(', ')} adjacent to ${sectionName}`)
              newSelections.push(...addedSelections)
            }
          })

          if (newSelections.length == 0)
            return

          const newNode: SelectionSetNode = {
            ...node,
            selections: [...node.selections, ...newSelections]
          }
          return newNode
        }
      }
    }) : undefined

    return {
      ...file,
      document: document,
    }
  })

  if (config.verbose)
    console.debug(`[ OPTIMIZELY ] Finished transformation procedure`)
  return transformedFiles
}

export default { transform }

function isNotNullOrUndefined<T>(toTest?: T | null) {
  return toTest !== null && toTest !== undefined
}
function isFragmentOrOperation(x: ASTNode | Readonly<ASTNode[]> | undefined | null): x is FragmentDefinitionNode | OperationDefinitionNode {
  if (Array.isArray(x) || x == undefined || x == null)
    return false
  return (x as ASTNode).kind == Kind.FRAGMENT_DEFINITION || (x as ASTNode).kind == Kind.OPERATION_DEFINITION
}
