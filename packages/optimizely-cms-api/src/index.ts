export * from './config'
export * as IntegrationApi from './client/types.gen'
export { ApiClient, ApiError, ApiClient as CoreClient, type ApiClientStatic, type CmsIntegrationApiClient } from './api-client'

import { type CmsIntegrationApiOptions } from './config'
import { ApiClient, type CmsIntegrationApiClient } from './api-client'

export { readEnvConfig } from './config'

/**
 * Type alias describing a CMS Integration API client instance.
 */
export type ApiClientInstance = CmsIntegrationApiClient

/**
 * Creates a new CMS Integration API client instance.
 *
 * @param config - Optional client configuration.
 * @returns The configured API client.
 */
export function createClient(config?: CmsIntegrationApiOptions): CmsIntegrationApiClient {
  return new ApiClient(config)
}

/**
 * Determines whether a value is a CMS Integration API client instance.
 *
 * @param value - Value to inspect.
 * @returns `true` when the value matches the client instance shape.
 */
export function isClientInstance(value?: object): value is CmsIntegrationApiClient {
  if (typeof value !== 'object' || value === null)
    return false
  return typeof (value as CmsIntegrationApiClient)['getInstanceInfo'] === 'function'
}

/**
 * A list of all hard-coded content roots within Optimizely CMS (Both 12+ & SaaS),
 * you need these to be able to start reading content from a given location.
 */
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
