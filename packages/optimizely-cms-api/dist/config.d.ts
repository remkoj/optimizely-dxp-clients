export type CmsIntegrationApiOptions = {
    base: URL;
    clientId?: string;
    clientSecret?: string;
    actAs?: string;
    debug?: boolean;
};
export declare function getCmsIntegrationApiConfigFromEnvironment(): CmsIntegrationApiOptions;
