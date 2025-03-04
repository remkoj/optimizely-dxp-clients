export * from './config'
export * as IntegrationApi from './client/types.gen'
export { ApiClient, ApiError, ApiClient as CoreClient, type ApiClientStatic, type CmsIntegrationApiClient } from './api-client'
export { OptiCmsVersion } from "./types"

import { type CmsIntegrationApiOptions } from './config'
import { ApiClient, type CmsIntegrationApiClient } from './api-client'

export function createClient(config?: CmsIntegrationApiOptions): CmsIntegrationApiClient {
  return new ApiClient(config)
}

export enum ContentRoots {
  /**
   * The Global root node of the Content Tree
   */
  SystemRoot = "43f936c99b234ea397b261c538ad07c9",
  /**
   * The root node of the Multi-Channel Content
   */
  MultiChannelContent = "41118A415C8C4BE08E73520FF3DE8244",
  /**
   * The root node of the Trash
   */
  Trash = "2f40ba47f4fc47aea2440b909d4cf988",
  /**
   * The root node of the "For all sites" folder
   */
  ForAllSites = "e56f85d0e8334e02976a2d11fe4d598c"
}

export enum ContentTypeKeys {
  Folder = "SysContentFolder"
}

export default createClient