export * from './config'
export * as IntegrationApi from './client'
export { CmsIntegrationApiClient as CoreClient } from './client'
export { ApiClient } from './api-client'
export { ApiClient as CmsIntegrationApiClient } from './api-client'

import { type CmsIntegrationApiOptions } from './config'
import {  ApiClient as CmsIntegrationApiClient } from './api-client'

export function createClient(config?: CmsIntegrationApiOptions) : CmsIntegrationApiClient
{
    return new CmsIntegrationApiClient(config)
}

export enum ContentRoots {
    SystemRoot = "43f936c99b234ea397b261c538ad07c9",
    MultiChannelContent = "41118A415C8C4BE08E73520FF3DE8244"
}

export enum ContentTypeKeys {
    Folder = "SysContentFolder"
}

export default createClient