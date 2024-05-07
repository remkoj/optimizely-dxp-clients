"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsIntegrationApiClient = void 0;
const FetchHttpRequest_1 = require("./core/FetchHttpRequest");
const ChangesetsService_1 = require("./services/ChangesetsService");
const ContentService_1 = require("./services/ContentService");
const ContentTypesService_1 = require("./services/ContentTypesService");
const OauthService_1 = require("./services/OauthService");
const PackagesService_1 = require("./services/PackagesService");
const PropertyFormatsService_1 = require("./services/PropertyFormatsService");
const PropertyGroupsService_1 = require("./services/PropertyGroupsService");
class CmsIntegrationApiClient {
    constructor(config, HttpRequest = FetchHttpRequest_1.FetchHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? '/_cms/preview2',
            VERSION: config?.VERSION ?? 'preview2',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });
        this.changesets = new ChangesetsService_1.ChangesetsService(this.request);
        this.content = new ContentService_1.ContentService(this.request);
        this.contentTypes = new ContentTypesService_1.ContentTypesService(this.request);
        this.oauth = new OauthService_1.OauthService(this.request);
        this.packages = new PackagesService_1.PackagesService(this.request);
        this.propertyFormats = new PropertyFormatsService_1.PropertyFormatsService(this.request);
        this.propertyGroups = new PropertyGroupsService_1.PropertyGroupsService(this.request);
    }
}
exports.CmsIntegrationApiClient = CmsIntegrationApiClient;
