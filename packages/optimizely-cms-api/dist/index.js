"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentTypeKeys = exports.ContentRoots = exports.createClient = exports.getAccessToken = exports.CmsIntegrationApiClient = exports.IntegrationApi = void 0;
__exportStar(require("./config"), exports);
exports.IntegrationApi = __importStar(require("./client"));
var client_1 = require("./client");
Object.defineProperty(exports, "CmsIntegrationApiClient", { enumerable: true, get: function () { return client_1.CmsIntegrationApiClient; } });
const config_1 = require("./config");
const client_2 = require("./client");
function isErrorResponse(response) {
    return typeof (response.error) == 'string';
}
let _access_token = undefined;
async function getAccessToken(config) {
    if (!_access_token) {
        _access_token = (async (config) => {
            const options = config ?? (0, config_1.getCmsIntegrationApiConfigFromEnvironment)();
            const authUrl = `${options.base.href}/oauth/token`;
            const headers = new Headers();
            headers.append('Authorization', `Basic ${base64Encode(`${options.clientId}:${options.clientSecret}`)}`);
            headers.append('Content-Type', 'application/x-www-form-urlencoded');
            headers.append('Connection', 'close');
            const body = new URLSearchParams();
            body.append("grant_type", "client_credentials");
            if (options.actAs)
                body.append("act_as", options.actAs);
            const response = await (await fetch(authUrl, {
                method: "POST",
                headers: headers,
                body: body.toString()
            })).json();
            if (isErrorResponse(response))
                throw new Error("Authentication error: " + response.error_description);
            return response.access_token;
        })(config);
    }
    return _access_token;
}
exports.getAccessToken = getAccessToken;
function createClient(config) {
    const options = config ?? (0, config_1.getCmsIntegrationApiConfigFromEnvironment)();
    const client = new client_2.CmsIntegrationApiClient({
        BASE: options.base.href,
        TOKEN: () => getAccessToken(options),
        HEADERS: {
            Connection: "Close"
        }
    });
    return client;
}
exports.createClient = createClient;
var ContentRoots;
(function (ContentRoots) {
    ContentRoots["SystemRoot"] = "43f936c99b234ea397b261c538ad07c9";
    ContentRoots["MultiChannelContent"] = "41118A415C8C4BE08E73520FF3DE8244";
})(ContentRoots || (exports.ContentRoots = ContentRoots = {}));
var ContentTypeKeys;
(function (ContentTypeKeys) {
    ContentTypeKeys["Folder"] = "SysContentFolder";
})(ContentTypeKeys || (exports.ContentTypeKeys = ContentTypeKeys = {}));
function base64Encode(input) {
    if (btoa && typeof (btoa) == 'function')
        return btoa(input);
    if (Buffer && typeof (Buffer) == 'object')
        //@ts-expect-error
        return Buffer.from(input).toString('base64');
    throw new Error("Unable to base64Encode");
}
exports.default = createClient;
