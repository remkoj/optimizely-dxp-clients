"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCmsIntegrationApiConfigFromEnvironment = void 0;
const OpenAPI_1 = require("./client/core/OpenAPI");
function getCmsIntegrationApiConfigFromEnvironment() {
    const cmsUrl = getMandatory('OPTIMIZELY_CMS_URL');
    const clientId = getMandatory('OPTIMIZELY_CMS_CLIENT_ID');
    const clientSecret = getMandatory('OPTIMIZELY_CMS_CLIENT_SECRET');
    const actAs = getOptional('OPTIMIZELY_CMS_USER_ID');
    const debug = getOptional('OPTIMIZELY_DEBUG', "0") == "1";
    let baseUrl;
    try {
        baseUrl = new URL(OpenAPI_1.OpenAPI.BASE, cmsUrl);
    }
    catch {
        throw new Error("Invalid URL provided");
    }
    if (debug)
        console.log(`[Optimizely CMS API] Connecting to ${baseUrl} as ${clientId}`);
    return {
        base: baseUrl,
        clientId,
        clientSecret,
        actAs,
        debug
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
