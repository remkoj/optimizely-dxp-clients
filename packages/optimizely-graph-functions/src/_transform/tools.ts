import type { Types } from '@graphql-codegen/plugin-helpers'
import { Kind, visit, type DocumentNode, type FragmentDefinitionNode, type ASTNode, type OperationDefinitionNode } from 'graphql'

/** An array of `Types.DocumentFile` items representing the full document set being transformed. */
export type DocumentSet = Types.DocumentFile[]

/** Metadata extracted from a single fragment definition. */
export type FragmentMetaData = {
  fragmentName: string,
  targetType: string,
  location?: string
}

/**
 * A typed array of `FragmentMetaData` items extended with convenience lookup methods:
 * - `get(fragmentName)` — find by fragment name
 * - `has(fragmentName)` — check existence by fragment name
 * - `hasForType(targetType)` — check if any fragment targets the given type
 * - `forType(targetType)` — filter to fragments targeting the given type
 */
export type FragmentMetaDataList = Array<FragmentMetaData> & {
  get(targetType: string): FragmentMetaData | undefined
  has(targetType: string): boolean
  hasForType(targetType: string): boolean
  forType(targetType: string): FragmentMetaDataList
}

function createFragmentMetaDataList(initialItems?: Array<FragmentMetaData>): FragmentMetaDataList {
  const list = [...(initialItems || [])] as unknown as FragmentMetaDataList;

  list.hasForType = (function (this: FragmentMetaData[], targetType: string) {
    return this.some(x => x.targetType === targetType)
  }).bind(list);
  list.forType = (function (this: FragmentMetaData[], targetType: string) {
    return createFragmentMetaDataList(this.filter(x => x.targetType === targetType))
  }).bind(list)
  list.get = (function (this: FragmentMetaData[], fragmentName: string) {
    return this.find(x => x.fragmentName === fragmentName)
  }).bind(list);
  list.has = (function (this: FragmentMetaData[], fragmentName: string) {
    return this.some(x => x.fragmentName === fragmentName)
  }).bind(list);

  return list
}

export function getAllFragments(files: DocumentSet): FragmentMetaDataList {
  const fragmentList = files.reduce<Array<FragmentMetaData>>((list, file) => {
    if (file.document) visit(file.document, {
      FragmentDefinition: {
        enter(node) {
          list.push({
            fragmentName: node.name.value,
            targetType: node.typeCondition.name.value,
            location: file.location
          })
        }
      }
    })
    return list
  }, [])
  return createFragmentMetaDataList(fragmentList)
}

/** Metadata extracted from a single query operation definition. */
export type QueryMetaData = {
  queryName: string,
  targetTypes: Array<string>,
  location?: string
}

/**
 * A typed array of `QueryMetaData` items extended with convenience lookup methods:
 * - `get(queryName)` — find by query name
 * - `has(queryName)` — check existence by query name
 * - `hasForType(targetType)` — check if any query selects the given type
 * - `forType(targetType)` — filter to queries that select the given type
 */
export type QueryMetaDataList = Array<QueryMetaData> & {
  get(queryName: string): QueryMetaData | undefined
  has(queryName: string): boolean
  hasForType(targetType: string): boolean
  forType(targetType: string): QueryMetaDataList
}

function createQueryMetaDataList(initialItems?: Array<QueryMetaData>): QueryMetaDataList {
  const list = [...(initialItems || [])] as unknown as QueryMetaDataList;

  list.hasForType = (function (this: QueryMetaData[], targetType: string) {
    return this.some(x => x.targetTypes.includes(targetType))
  }).bind(list);
  list.forType = (function (this: QueryMetaData[], targetType: string) {
    return createQueryMetaDataList(this.filter(x => x.targetTypes.includes(targetType)))
  }).bind(list);
  list.get = (function (this: QueryMetaData[], queryName: string) {
    return this.find(x => x.queryName === queryName)
  }).bind(list);
  list.has = (function (this: QueryMetaData[], queryName: string) {
    return this.some(x => x.queryName === queryName)
  }).bind(list);

  return list
}

/**
 * Retrieve the metadata from all queries that are defined in the provided `DocumentSet`.
 *
 * @param files  The document set to scan
 * @returns      A `QueryMetaDataList` with all discovered query definitions
 */
export function getAllQueries(files: DocumentSet): QueryMetaDataList {
  const queryList = files.reduce<Array<QueryMetaData>>((list, file) => {
    if (file?.document) visit(file.document, {
      OperationDefinition: {
        enter(node) {
          if (node.operation !== 'query')
            return;
          const queryName = node.name?.value;
          if (!queryName)
            return;
          const metaData: QueryMetaData = {
            queryName,
            targetTypes: node.selectionSet.selections.filter(x => x.kind == 'Field').map(x => x.name.value),
            location: file.location
          }
          list.push(metaData)
        }
      }
    })
    return list
  }, [])
  return createQueryMetaDataList(queryList)
}

/**
 * Collect every object and interface type name declared in the given schema document.
 *
 * @param schema  The parsed schema `DocumentNode`
 * @returns       Flat list of all object and interface type names
 */
export function getAllTypeNames(schema: DocumentNode): string[] {
  const names: string[] = [];
  visit(schema, {
    ObjectTypeDefinition: {
      enter(node) {
        names.push(node.name.value)
      }
    },
    InterfaceTypeDefinition: {
      enter(node) {
        names.push(node.name.value)
      }
    }
  })
  return names
}

export function isFragmentOrOperation(x: ASTNode | Readonly<ASTNode[]> | undefined | null): x is FragmentDefinitionNode | OperationDefinitionNode {
  if (x == undefined || x == null)
    return false
  if (Array.isArray(x))
    return x.some((y: ASTNode) => y.kind === Kind.FRAGMENT_DEFINITION || y.kind === Kind.OPERATION_DEFINITION);
  return (x as ASTNode).kind === Kind.FRAGMENT_DEFINITION || (x as ASTNode).kind === Kind.OPERATION_DEFINITION;
}

export function flatten<T>(x: T | ReadonlyArray<T> | Array<T> | Array<Readonly<T>> | Readonly<T>): ReadonlyArray<Readonly<T>>
{
  return Array.isArray(x) ? x : ([x] as ReadonlyArray<Readonly<T>>);
}