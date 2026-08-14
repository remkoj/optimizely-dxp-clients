import type { Types } from '@graphql-codegen/plugin-helpers'
import {
  visit,
  print,
  Kind,
  type DocumentNode,
  type ArgumentNode,
  type Location,
  FieldNode,
} from 'graphql'
import type { PresetOptions } from '../types'

/**
 * Remove the "item" field in queries and fragments from the "ContentReference" type if it's not in the schema
 *
 * @param files
 * @param options
 * @returns
 */
export async function handleDependDirective(
  files: Types.DocumentFile[],
  schema: DocumentNode,
  options: PresetOptions
): Promise<Types.DocumentFile[]> {
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
            const fields = getObjectFieldNames(schema, typeName);
            isModified = true;
            if (!(fields?.includes(fieldName) ?? false)) {
              if (options.verbose)
                console.log(`❌ [Optimizely] Removing field ${ node.name.value } due to the ${ fieldName } not being present on ${ typeName }`);
              return null // Remove the item
            } else {
              const newNode : FieldNode = {
                ...node,
                directives: node.directives?.filter(x => x.name.value !== 'depend')
              }
              return newNode;
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

/** Build a human-readable source location string from a node's `loc` property for error messages. */
function buildLocString(node: WithLocation) : string
{
  if (!node.loc)
    return ""
  const sourceName = node.loc.source.name
  const startLine = node.loc.startToken.line
  const startChar = node.loc.startToken.column

  return `in ${ sourceName } at line ${ startLine }, position ${ startChar }`
}

/** Parse a directive's arguments into a `Map<name, value>`, converting GraphQL scalar kinds to JS primitives. */
function parseArgs(args?: readonly ArgumentNode[]) : Map<string,unknown>
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
  }, new Map<string,unknown>()) ?? new Map<string,unknown>();
}

/** Return all field names declared on the object type named `objectName` in the schema, or `undefined` when the type is absent. */
function getObjectFieldNames(
  schema: DocumentNode,
  objectName: string
): string[] | undefined {
  let currentObjectName: string | undefined
  const objectFields: string[] = []
  visit(schema, {
    ObjectTypeDefinition: {
      enter(node) {
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
