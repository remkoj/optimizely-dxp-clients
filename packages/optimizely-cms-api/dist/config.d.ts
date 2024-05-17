export type CmsIntegrationApiOptions = {
    base: URL;
    clientId?: string;
    clientSecret?: string;
    actAs?: string;
};
export declare function getCmsIntegrationApiConfigFromEnvironment(): CmsIntegrationApiOptions;
