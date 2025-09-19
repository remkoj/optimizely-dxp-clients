import type { CliModule } from '../types.js'
import { type IntegrationApi } from '@remkoj/optimizely-cms-api'
import { type ContentTypesArgs, contentTypesBuilder } from '../tools/contentTypes.js'
import { getContentTypePaths, ContentTypePathInfo } from '../tools/project.js'

export type NextJsCommandArgs = ContentTypesArgs & {
  force: boolean
}

export type NextJsModule<A = any> = CliModule<NextJsCommandArgs, A>

export type TypeFolderList = Array<ContentTypePathInfo>

export const builder: NextJsModule['builder'] = yargs => {
  const updatedArgs = contentTypesBuilder(yargs)
  updatedArgs.option('force', { alias: 'f', description: "Overwrite existing files", boolean: true, type: 'boolean', demandOption: false, default: false })
  return updatedArgs
}

export type Promised<T> = T extends PromiseLike<infer R> ? R : T

export { getContentTypePaths } from "../tools/project.js"

export function createTypeFolders(contentTypes: Array<IntegrationApi.ContentType>, basePath: string, debug: boolean = false): TypeFolderList {
  return contentTypes.map(contentType => getContentTypePaths(contentType, basePath, true, debug))
}

export function getTypeFolder(list: TypeFolderList, type: string): ContentTypePathInfo | undefined {
  return list.filter(x => x.type == type).at(0)
}