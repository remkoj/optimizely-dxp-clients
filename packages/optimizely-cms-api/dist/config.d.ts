export type CmsIntegrationApiOptions = {
    base: URL;
    clientId?: string;
    clientSecret?: string;
    actAs?: string;
};
export declare const API_VERSION = "v0.5";
export declare function getCmsIntegrationApiConfigFromEnvironment(): CmsIntegrationApiOptions;
