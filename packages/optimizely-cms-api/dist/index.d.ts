export * from './config';
export * as IntegrationApi from './client';
export { CmsIntegrationApiClient } from './client';
import { type CmsIntegrationApiOptions } from './config';
import { CmsIntegrationApiClient } from './client';
export declare function getAccessToken(config?: CmsIntegrationApiOptions): Promise<string>;
export declare function createClient(config?: CmsIntegrationApiOptions): CmsIntegrationApiClient;
export declare enum ContentRoots {
    SystemRoot = "43f936c99b234ea397b261c538ad07c9",
    MultiChannelContent = "41118A415C8C4BE08E73520FF3DE8244"
}
export declare enum ContentTypeKeys {
    Folder = "SysContentFolder"
}
export default createClient;
