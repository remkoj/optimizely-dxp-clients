import type { Types } from '@graphql-codegen/plugin-helpers'
import { visit, Kind, type FragmentDefinitionNode, type ASTNode, type SelectionNode, type SelectionSetNode, type FragmentSpreadNode, type OperationDefinitionNode } from 'graphql'
import { VirtualLocation } from '../generator'
import type { PresetOptions, Injection, TransformOptions } from '../types'
import { defaultOptions, pickTransformOptions } from "./options"

/**
 * Check all fragments within the project and ensure that there's at least a fragment for every
 * content type defined in Optimizely CMS. This assumes that when overriding the fragments the
 * project will ensure that the injections are correct.
 * 
 * @param files 
 * @param options 
 * @returns 
 */
export async function performInjections(files: Types.DocumentFile[], options: Types.PresetFnArgs<PresetOptions>): Promise<Types.DocumentFile[]> {
  if (options.presetConfig.verbose)
    console.log(`✨ [Optimizely] Running injections into targeted components`)

  // Create context
  const config: Readonly<Required<TransformOptions>> = { ...defaultOptions, ...pickTransformOptions(options.presetConfig) };
  const componentFragments = await getComponentFragments(files, config);

  // Get the names we actually need to inject into, and return when none are present
  const intoNames: string[] = Array.from(componentFragments.keys());
  if (intoNames.length == 0) return files
  if (config.verbose)
    intoNames.forEach(intoName => {
      console.debug(`    - Will update queries & fragments using the fragment ${intoName} to also use the fragments:\n      - ${(componentFragments.get(intoName) ?? []).map(x => `${x.name} (${x.location})`).join("\n      - ")}`)
    })

  function isTargetedSpread(node: SelectionNode): node is FragmentSpreadNode {
    return node.kind == Kind.FRAGMENT_SPREAD && intoNames.includes(node.name.value)
  }

  // Run the actual transformation
  const transformedFiles = files.map(file => {
    const document = file.document ? visit(file.document, {
      // Replace the fragment occurances
      SelectionSet: {
        leave(node, key, parent, path, ancestors) {
          // Get the parent name
          const parentName = [...ancestors].reverse().filter(isFragmentOrOperation).at(0)?.name?.value

          // Get the sections that need to be added here, return if none found
          const sectionsToAdd = node.selections.filter(isTargetedSpread).map(x => x.name.value)
          if (sectionsToAdd.length == 0)
            return

          // Debug output
          if (config.verbose)
            console.debug(`    - Identified usage of fragment(s) ${sectionsToAdd.join(', ')} in ${parentName} (${file.location}), starting injection procedure`)

          // Create context
          const newSelections: SelectionNode[] = []
          const existingSpreads: string[] = node.selections.filter(x => x.kind === Kind.FRAGMENT_SPREAD).map(x => x.name.value)

          // Loop over the sections that must be processed
          sectionsToAdd.forEach(sectionName => {
            // Loop over the contents of each section
            const addedSelections: FragmentSpreadNode[] = (componentFragments.get(sectionName) ?? []).map(fragment => {
              // Check if the spread already exist, and skip if it does exist
              if (existingSpreads.includes(fragment.name))
                return undefined

              // Add the current fragment to the list to prevent issues, with the same fragment being in multiple sections
              existingSpreads.push(fragment.name)
              return {
                kind: Kind.FRAGMENT_SPREAD,
                directives: [],
                name: {
                  kind: Kind.NAME,
                  value: fragment.name
                }
              } as FragmentSpreadNode
            }).filter(isNotNullOrUndefined)

            // Chick the fragments we've added
            if (addedSelections.length > 0) {
              if (config.verbose)
                console.log(`      - Added fragments ${addedSelections.map(a => a.name.value).join(', ')} adjacent to ${sectionName}`)
              newSelections.push(...addedSelections)
            }
          })

          // If there're no changes, just return the old fragment
          if (newSelections.length == 0)
            return

          // Build the new SelectionSet
          const newNode: SelectionSetNode = {
            ...node,
            selections: [...node.selections, ...newSelections]
          }

          // If cleanup is disabled just return the new node
          if (!config.cleanup || (Array.isArray(config.cleanup) && config.cleanup.length === 0))
            return newNode

          // Filter the selections if cleanup is enabled
          newNode.selections = newNode.selections.filter(selection => {
            if (selection.kind !== Kind.FRAGMENT_SPREAD)
              return true // Allow all non-fragment spreads
            if (config.cleanup && !Array.isArray(config.cleanup) && (sectionsToAdd.includes(selection.name.value) || ['PageData', 'BlockData'].includes(selection.name.value)))
              return false // Remove matching sections and PageData & BlockData, for any truethy, non-array value for cleanup
            if (Array.isArray(config.cleanup) && config.cleanup.includes(selection.name.value))
              return false // Remove all explicitly listed fragment spreads
            return true
          })

          return newNode
        }
      }
    }) : undefined

    return {
      ...file,
      document: document,
    }
  });

  return transformedFiles;
}

export default performInjections

type TargetedFragementInfo = {
  name: string
  contentType: string
  definition: FragmentDefinitionNode
  location?: string
}
type TargetedFragments = Map<string, Array<TargetedFragementInfo>>

export function getInjectionsByFile(file: Types.DocumentFile, injections: Injection[]): Array<Injection> {
  const applicableInjections = injections.filter(injection => !injection.pathRegex || (new RegExp(injection.pathRegex)).test(file.location ?? ""))
  return applicableInjections ?? []
}

export function getInjectionsByFragmentName(fragmentName: string, injections: Injection[]): Array<Injection> {
  const matchingInjections = injections.filter(injection => !injection.nameRegex || (new RegExp(injection.nameRegex)).test(fragmentName))
  return matchingInjections ?? []
}

export async function getComponentFragments(files: Types.DocumentFile[], { injections, verbose }: Readonly<Required<TransformOptions>>): Promise<TargetedFragments> {
  // First process files based upon injection configuration
  const newOutput = files.reduce<TargetedFragments>((componentFragments, file) => {
    if (!file.document)
      return componentFragments; /// Stop if we don't have a document

    // Check if this an internally generated fragment
    const vLocInfo = file.location ? VirtualLocation.parse(file.location) : undefined
    if (vLocInfo) {
      // Only process the Virtual Location if it's for a non-property fragment with at least one injection target
      if (vLocInfo.type !== 'fragment' || vLocInfo.forProperty || vLocInfo.injectionTargets.length == 0)
        return componentFragments

      // Extract needed properties from the parsed URL
      const { injectionTargets: targets, contentTypeKey } = vLocInfo

      // Walk the document to process all fragments in it
      visit(file.document, {
        FragmentDefinition: {
          enter(node) {
            targets.forEach(target => {
              const currentFragments = (componentFragments.get(target) || []);
              if (!currentFragments.some(cf => cf.name == node.name.value)) {
                currentFragments.push({
                  name: node.name.value,
                  contentType: contentTypeKey,
                  definition: node,
                  location: file.location
                })
                componentFragments.set(target, currentFragments)
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
            const contentTypeKey = node.typeCondition.name.value
            const target = injection.into
            const currentFragments = (componentFragments.get(target) || []);
            if (!currentFragments.some(cf => cf.name == node.name.value)) {
              currentFragments.push({
                name: node.name.value,
                contentType: contentTypeKey,
                definition: node,
                location: file.location
              })
              componentFragments.set(target, currentFragments)
            }
          })
        }
      }
    })
    return componentFragments
  }, new Map<string, Array<TargetedFragementInfo>>())

  return newOutput
}

function isNotNullOrUndefined<T>(toTest?: T | null) {
  return toTest !== null && toTest !== undefined
}
function isFragmentOrOperation(x: ASTNode | Readonly<ASTNode[]> | undefined | null): x is FragmentDefinitionNode | OperationDefinitionNode {
  if (Array.isArray(x) || x == undefined || x == null)
    return false
  return (x as ASTNode).kind == Kind.FRAGMENT_DEFINITION || (x as ASTNode).kind == Kind.OPERATION_DEFINITION
}
