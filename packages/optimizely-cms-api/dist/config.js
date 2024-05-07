"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCmsIntegrationApiConfigFromEnvironment = exports.API_VERSION = void 0;
exports.API_VERSION = 'v0.5';
function getCmsIntegrationApiConfigFromEnvironment() {
    const cmsUrl = getMandatory('OPTIMIZELY_CMS_URL');
    const clientId = getMandatory('OPTIMIZELY_CMS_CLIENT_ID');
    const clientSecret = getMandatory('OPTIMIZELY_CMS_CLIENT_SECRET');
    const actAs = getOptional('OPTIMIZELY_CMS_USER_ID');
    let baseUrl;
    try {
        baseUrl = new URL('/_cms/' + exports.API_VERSION, cmsUrl);
    }
    catch {
        throw new Error("Invalid URL provided");
    }
    return {
        base: baseUrl,
        clientId,
        clientSecret,
        actAs
    };
}
exports.getCmsIntegrationApiConfigFromEnvironment = getCmsIntegrationApiConfigFromEnvironment;
function getOptional(variable, defaultValue) {
    const envValue = process.env[variable];
    if (!envValue || envValue == "")
        return defaultValue;
    return envValue;
}
function getMandatory(variable) {
    const envValue = process.env[variable];
    if (!envValue)
        throw new Error(`The environment variable ${variable} is missing or empty`);
    return envValue;
}
