import type { Types } from '@graphql-codegen/plugin-helpers'
import {
  visit,
  print,
  Kind,
  type FragmentDefinitionNode,
  type ASTNode,
  type DocumentNode,
  type SelectionNode,
  type SelectionSetNode,
  type FragmentSpreadNode,
  type OperationDefinitionNode,
  type ArgumentNode,
  type Location,
  OperationTypeNode,
} from 'graphql'
import * as QueryGen from '../contenttype-loader'
import type { PresetOptions, Injection, TransformOptions } from '../types'
import { defaultOptions, pickTransformOptions } from './options'

/**
 * Remove the "item" field in queries and fragments from the "ContentReference" type if it's not in the schema
 *
 * @param files
 * @param options
 * @returns
 */
export async function handleDependDirective(
  files: Types.DocumentFile[],
  options: Types.PresetFnArgs<PresetOptions>
): Promise<Types.DocumentFile[]> {
  // Debug output
  if (options.presetConfig.verbose)
    console.log(
      `✨ [Optimizely] Checking ContentReference to determine if it has an "item" field`
    )

  // Ouch, this is an old SaaS CMS instance, so we're going to clean this field
  if (options.presetConfig.verbose)
    console.log(`✨ [Optimizely] Nope it hasn't removing any reference to it`)

  const filteredFiles: Types.DocumentFile[] = files.map((file) => {
    let isModified = false
    const newDocument = file.document ? visit(file.document, {
      Field: {
        enter(node) {
          // Check if the field has the `depend` directive
          const dependDirective = node.directives?.find(x => x.name.value === 'depend')
          if (dependDirective) {

            // If so read the arguments and validate if the required "on" argument is there
            const args = parseArgs(dependDirective.arguments)
            const dependency = args.get('on')
            if (typeof dependency !== 'string' || dependency.length === 0)
              throw new Error(`The "@depend" directive requires the parameter "on" to be a non-empty string ${ buildLocString(dependDirective)}`)
            
            // Parse & validate the argument
            const [ typeName, fieldName, ...remaining] = dependency.split('.')
            if (remaining.length > 0)
              throw new Error(`The "on" parameter of the "@depend" directive must have the form "typeName.fieldName" ${ buildLocString(dependDirective)}`)

            // Retrieve the type fields
            const fields = getObjectFieldNames(options.schema, typeName)
            if (!(fields?.includes(fieldName) ?? false)) {
              isModified = true;
              return null // Remove the item
            }
          }
        }
      }
    }) : undefined
    return isModified
      ? ({
          ...file,
          rawSDL: newDocument ? print(newDocument) : undefined,
          document: newDocument,
        } as Types.DocumentFile)
      : file
  })
  return filteredFiles
}

export default handleDependDirective

type WithLocation = {
  loc?: Location
}

function buildLocString(node: WithLocation) : string
{
  if (!node.loc)
    return ""
  const sourceName = node.loc.source.name
  const startLine = node.loc.startToken.line
  const startChar = node.loc.startToken.column

  return `in ${ sourceName } at line ${ startLine }, position ${ startChar }`
}

function parseArgs(args?: readonly ArgumentNode[]) : Map<string,any>
{
  return args?.reduce((out, arg) => {
    const argName = arg.name.value
    switch (arg.value.kind) {
      case Kind.INT: 
        out.set(argName, parseInt(arg.value.value))
        break;
      case Kind.BOOLEAN:
        out.set(argName, new Boolean(arg.value.value))
        break;
      case Kind.STRING:
        out.set(argName, arg.value.value)
        break;
      default:
        throw new Error(`Error parsing directive arguments, encountered unsupported argument kind ${ arg.value.kind } for ${ argName } ${ buildLocString(arg) }`)
    }
    return out
  }, new Map<string,any>()) ?? new Map<string,any>();
}

function getObjectFieldNames(
  schema: DocumentNode,
  objectName: string
): string[] | undefined {
  let currentObjectName: string | undefined
  let objectFields: string[] = []
  let hasType: boolean = false
  visit(schema, {
    ObjectTypeDefinition: {
      enter(node) {
        if (node.name.value === objectName)
          hasType = true;
        currentObjectName = node.name.value
      },
      leave(node) {
        if (currentObjectName === node.name.value) currentObjectName = undefined
      },
    },
    FieldDefinition: {
      enter(node) {
        if (currentObjectName === objectName) objectFields.push(node.name.value)
      },
    },
  })
  return objectFields
}

function isASTNode(node: ASTNode | readonly ASTNode[]) : node is ASTNode
{
  return !Array.isArray(node)
}

function isNotNullOrUndefined<T>(toTest?: T | null) {
  return toTest !== null && toTest !== undefined
}
function isFragmentOrOperation(
  x: ASTNode | Readonly<ASTNode[]> | undefined | null
): x is FragmentDefinitionNode | OperationDefinitionNode {
  if (Array.isArray(x) || x == undefined || x == null) return false
  return (
    (x as ASTNode).kind == Kind.FRAGMENT_DEFINITION ||
    (x as ASTNode).kind == Kind.OPERATION_DEFINITION
  )
}
