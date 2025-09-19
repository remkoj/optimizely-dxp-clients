import type { Types } from '@graphql-codegen/plugin-helpers'
import { Kind, visit, parse, type DocumentNode } from 'graphql'

export type DocumentSet = Types.DocumentFile[]

export type FragmentMetaData = {
  fragmentName: string,
  targetType: string,
  location?: string
}

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

export type QueryMetaData = {
  queryName: string,
  targetTypes: Array<string>,
  location?: string
}

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
 * Retrieve the metadata from all queries that are defined in the provided DocumentSet
 * 
 * @param files 
 * @returns 
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