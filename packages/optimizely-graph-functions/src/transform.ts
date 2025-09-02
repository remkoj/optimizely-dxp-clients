import { type Types } from '@graphql-codegen/plugin-helpers'
import type { Injection, TransformOptions } from './types'
import type { FragmentDefinitionNode, SelectionNode, SelectionSetNode, ASTNode, OperationDefinitionNode, FragmentSpreadNode } from 'graphql'
import { Kind, visit } from 'graphql'

export { cleanFragments } from "./_transform/cleanFragments"
export { injectComponentDocuments } from "./_transform/injectComponentDocuments"
export { normalizeFragmentNames } from "./_transform/normalizeFragmentNames"
export { pickTransformOptions } from "./_transform/options"

import { defaultOptions } from "./_transform/options"

type TargetedFragementInfo = {
  name: string
  contentType: string
  definition: FragmentDefinitionNode
}

type TargetedFragments = {
  /**
   * All fragments for pages & experiences
   */
  PageData: Array<TargetedFragementInfo>
  /**
   * All fragments which are used for section enabled components
   */
  SectionData: Array<TargetedFragementInfo>
  /**
   * All fragments which are used for element enabled components
   */
  ElementData: Array<TargetedFragementInfo>
  /**
   * All fragments which are used components that are not enabled for VisualBuilder
   */
  BlockData: Array<TargetedFragementInfo>
  /**
   * All fragments which are used for from-element enabled components
   */
  FormElementData: Array<TargetedFragementInfo>
  /**
   * Custom groups defined by the implementation
   */
  [group: string]: Array<TargetedFragementInfo>
}

function getInjectionsByFile(file: Types.DocumentFile, injections: Injection[]): Array<Injection> {
  const applicableInjections = injections.filter(injection => !injection.pathRegex || (new RegExp(injection.pathRegex)).test(file.location ?? ""))
  return applicableInjections ?? []
}

function getInjectionsByFragmentName(fragmentName: string, injections: Injection[]): Array<Injection> {
  const matchingInjections = injections.filter(injection => !injection.nameRegex || (new RegExp(injection.nameRegex)).test(fragmentName))
  return matchingInjections ?? []
}




async function getComponentFragments(files: Types.DocumentFile[], { injections, verbose }: Readonly<Required<TransformOptions>>): Promise<TargetedFragments> {
  // First process files based upon injection configuration
  const newOutput = files.reduce<TargetedFragments>((componentFragments, file) => {
    if (!file.document)
      return componentFragments; /// Stop if we don't have a document

    // Check if this an internally generated fragment
    if (file.location?.startsWith('opti-cms:')) {
      const url = new URL(file.location)
      const [loaderType, baseType, contentTypeKey, ...targets] = url.pathname.split('/').filter(x => typeof x == 'string' && x.length > 0)
      if (loaderType !== 'contenttypes' || baseType.endsWith('.property'))
        return componentFragments; // Stop if we're processing an internal file, which is not a contenttype; or it's the property definition

      visit(file.document, {
        FragmentDefinition: {
          enter(node) {
            targets.forEach(target => {
              if (!componentFragments[target])
                componentFragments[target] = [];
              if (!componentFragments[target].some(f => f.name == node.name.value)) {
                if (verbose) console.debug(`[ OPTIMIZELY ] Found ${node.name.value} (data type: ${contentTypeKey}) for ${target} in file ${node.loc?.source?.name}`)
                componentFragments[target].push({
                  name: node.name.value,
                  contentType: contentTypeKey,
                  definition: node
                })
              }
            })
          }
        }
      })
      return componentFragments
    }

    // Check if this file matches an injection
    const applicableInjections = getInjectionsByFile(file, injections)
    if (applicableInjections.length == 0)
      return componentFragments; // Stop if we don't have a file or no injections for this file

    // Process the document
    visit(file.document, {
      FragmentDefinition: {
        enter(node) {
          const matchingInjections = getInjectionsByFragmentName(node.name.value, applicableInjections);
          matchingInjections.forEach(injection => {
            const contentType = node.typeCondition.name.value
            if (verbose) console.debug(`[ OPTIMIZELY ] Found ${node.name.value} (data type: ${contentType}) for ${injection.into} in file ${node.loc?.source?.name}`)
            if (!componentFragments[injection.into])
              componentFragments[injection.into] = []
            if (!componentFragments[injection.into].some(f => f.name == node.name.value)) {
              componentFragments[injection.into].push({
                name: node.name.value,
                contentType: contentType,
                definition: node
              })
            } else if (verbose)
              console.debug(`[ OPTIMIZELY ] There's already a fragment with the name  ${node.name.value} for ${injection.into} registered`)
          })
        }
      }
    })
    return componentFragments
  }, { BlockData: [], ElementData: [], FormElementData: [], PageData: [], SectionData: [] })

  return newOutput
}

export const transform: Types.DocumentTransformFunction<TransformOptions> = async ({ documents: files, config, schema, pluginContext }) => {
  // Create context
  const transformConfig: Readonly<Required<TransformOptions>> = { ...defaultOptions, ...config }
  if (transformConfig.verbose)
    console.debug(`[ OPTIMIZELY ] Starting Optimizely Graph Query & Fragment transformations`)

  // Process files and client...
  const allComponentFragments = await getComponentFragments(files, transformConfig)
  //console.log(allComponentFragments)

  // Get the names we actually need to inject into, and return when none are present
  const componentFragments = (Object.getOwnPropertyNames(allComponentFragments) as Array<keyof TargetedFragments>).reduce<Partial<TargetedFragments>>((partial, groupKey) => {
    if (Array.isArray(allComponentFragments[groupKey]) && allComponentFragments[groupKey].length > 0)
      partial[groupKey] = allComponentFragments[groupKey]
    return partial
  }, {})
  const intoNames = Object.getOwnPropertyNames(componentFragments)
  if (intoNames.length == 0) return files
  //if (config.verbose)
  intoNames.forEach(intoName => {
    console.debug(`[ OPTIMIZELY ] Update queries & fragments using the fragment ${intoName} to also use the fragments: ${(componentFragments[intoName] ?? []).map(x => x.name).join(',')}`)
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
            const addedSelections: FragmentSpreadNode[] = (componentFragments[sectionName] ?? []).map(fragment => {
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