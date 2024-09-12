import {type Types } from '@graphql-codegen/plugin-helpers'
import type { Injection } from './types'
import type { FragmentDefinitionNode, SelectionNode, FieldNode, SelectionSetNode, InlineFragmentNode } from 'graphql'
import { Kind, parse, visit } from 'graphql'
import fs from 'node:fs'

export type TransformOptions = {
    injections?: Injection[],
    verbose?: boolean
    recursion?: boolean
}

export function pickTransformOptions(options: Record<string,any>) : TransformOptions
{
    return {
        injections: options.injections ?? [],
        verbose: options.verbose ?? false,
        recursion: options.recursion ?? true
    }
}

function isArray<T>(toTest : T | readonly T[]) : toTest is readonly T[] { return Array.isArray(toTest) }

export const transform : Types.DocumentTransformFunction<TransformOptions> = ({documents: files, config, schema, pluginContext }) =>
{
    const injections = config.injections ?? []

    // Retrieve component fragments
    const componentFragments: { [ into: string ]: FragmentDefinitionNode[] } = {}
    files.forEach(file => {
        if (!file.document) return
        const applicableInjections = injections.filter(injection => !injection.pathRegex || (new RegExp(injection.pathRegex)).test(file.location ?? ""))
        if (!applicableInjections || applicableInjections.length == 0) return
        visit(file.document, {
            FragmentDefinition: {
                enter(node) {
                    const matchingInjections = applicableInjections.filter(injection => !injection.nameRegex || (new RegExp(injection.nameRegex)).test(node.name.value))
                    if (!matchingInjections || matchingInjections.length == 0)
                        return false
                    matchingInjections.forEach(injection => {
                        if (config.verbose) console.debug(`[ OPTIMIZELY ] Found ${ node.name.value } for ${ injection.into } in file ${ node.loc?.source?.name }`)
                        if (!componentFragments[injection.into])
                            componentFragments[injection.into] = []
                        if (!componentFragments[injection.into].some(f => f.name.value == node.name.value))
                            componentFragments[injection.into].push(node)
                    })
                    return undefined
                }
            }
        })
    })

    // Get the names we actually need to inject into, and return when none are present
    const intoNames = Object.getOwnPropertyNames(componentFragments)

    // Process recursion
    const componentSpreads : { [ into: string ]: InlineFragmentNode[] } = {}
    if (config.recursion && intoNames.length > 0) {
        // Process the fragments, add matching spreads if need be
        const recursiveFragments : string[] = [ "IContentListItem" ]
        
        intoNames.forEach(intoName => {
            componentFragments[intoName].forEach(fragment => {
                visit(fragment, {
                    FragmentSpread: {
                        leave(node, key, parent, path, ancestors) {
                            if (recursiveFragments.includes(node.name.value) && !isArray(ancestors[0]) && ancestors[0].kind == Kind.FRAGMENT_DEFINITION) {
                                if (config.verbose) console.debug(`[ OPTIMIZELY ] Found ${ node.name.value } within ${ fragment.name.value } for ${ intoName }, creating recursive fragment`)
                                const fields = ancestors.filter(a => !isArray(a) && a.kind != Kind.FRAGMENT_DEFINITION && a.kind != Kind.SELECTION_SET)
                                if (fields.length < 1)
                                    return undefined
                                if (fields.length > 1)
                                    throw new Error("Recursive items on embedded blocks are not supported at the moment")
                                const newNode : InlineFragmentNode = {
                                    kind: Kind.INLINE_FRAGMENT,
                                    typeCondition: ancestors[0].typeCondition,
                                    selectionSet: {
                                        kind: Kind.SELECTION_SET,
                                        selections: [{
                                            kind: Kind.FIELD,
                                            name: (fields[0] as FieldNode).name,
                                            alias: (fields[0] as FieldNode).alias,
                                            directives: [{
                                                kind: Kind.DIRECTIVE,
                                                name: { kind: Kind.NAME, value: "recursive" },
                                                arguments: [{
                                                    kind: Kind.ARGUMENT,
                                                    name: { kind: Kind.NAME, value: "depth" },
                                                    value: { kind: Kind.INT, value: "5" }
                                                }]
                                            }],
                                            selectionSet: {
                                                kind: Kind.SELECTION_SET,
                                                selections: recursiveSelections
                                            }
                                        }]
                                    }
                                }
                                if (!componentSpreads[intoName]) componentSpreads[intoName] = []
                                componentSpreads[intoName].push(newNode)
                            }
                        }
                    }
                })
            })
        })
    }

    // Update the documents
    return files.map(file => {
        const document = file.document ? visit(file.document, {
            // Remove fragments from the preset, for which the target type does not exist
            FragmentDefinition: {
                enter(node) {
                    if (file.location && !fs.existsSync(file.location)) {
                        const typePresent = schema.definitions.some(definition => (definition.kind == Kind.OBJECT_TYPE_DEFINITION || definition.kind == Kind.INTERFACE_TYPE_DEFINITION) && definition.name.value == node.typeCondition.name.value)
                        if (!typePresent) {
                            if (config.verbose) console.debug(`[OPTIMIZELY] Type ${ node.typeCondition.name.value } not found, dropping fragment ${ node.name.value }`)
                            return null
                        }
                    }
                }
            },

            // Replace the fragment occurances
            SelectionSet: {
                enter(node) {
                    const sectionsToAdd = node.selections
                        .map(selection => selection.kind == Kind.FRAGMENT_SPREAD && intoNames.includes(selection.name.value) ? selection.name.value : undefined)
                        .filter(isNotNullOrUndefined)
                    if (sectionsToAdd.length == 0)
                        return
                    if (config.verbose)
                        console.debug(`[ OPTIMIZELY ] Identified usage of fragment(s) ${ sectionsToAdd.join(', ') }, starting replacement procedure`)

                    const newSelections = [ ...node.selections ] //.filter(selection => !(selection.kind == Kind.FRAGMENT_SPREAD && intoNames.includes(selection.name.value)))
                    sectionsToAdd.forEach(sectionName => {
                        const addedSelections : SelectionNode[] = componentFragments[sectionName].map(fragment => {
                            if (config.verbose) 
                                console.debug(`[ OPTIMIZELY ] Adding fragment ${ fragment.name.value } adjacent to ${ sectionName }`)
                            return {
                                kind: Kind.FRAGMENT_SPREAD,
                                directives: [],
                                name: {
                                    kind: Kind.NAME,
                                    value: fragment.name.value
                                }
                            }
                        })
                        componentSpreads[sectionName]?.forEach(spread => {
                            if (config.verbose) console.debug(`[ OPTIMIZELY ] Adding inline fragment ${ spread.typeCondition?.name.value ?? "Untyped" } adjacent to ${ sectionName }`)
                            addedSelections.push(spread)
                        })
                        newSelections.push(...addedSelections)
                    })

                    const newNode : SelectionSetNode = {
                        ...node,
                        selections: newSelections
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
}

export default { transform }

// The recursive sections to add
const recursiveSelections = (parse(`fragment IContentListItem on _IContent {
    ...IContentData
}`).definitions[0] as FragmentDefinitionNode)?.selectionSet.selections || [];

function isNotNullOrUndefined<T>(toTest?: T | null) 
{
    return toTest !== null && toTest !== undefined
}