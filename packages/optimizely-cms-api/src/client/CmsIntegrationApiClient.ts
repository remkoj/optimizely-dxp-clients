/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';
import { ChangesetsService } from './services/ChangesetsService';
import { ContentService } from './services/ContentService';
import { ContentTypesService } from './services/ContentTypesService';
import { OauthService } from './services/OauthService';
import { PackagesService } from './services/PackagesService';
import { PropertyFormatsService } from './services/PropertyFormatsService';
import { PropertyGroupsService } from './services/PropertyGroupsService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class CmsIntegrationApiClient {
    public readonly changesets: ChangesetsService;
    public readonly content: ContentService;
    public readonly contentTypes: ContentTypesService;
    public readonly oauth: OauthService;
    public readonly packages: PackagesService;
    public readonly propertyFormats: PropertyFormatsService;
    public readonly propertyGroups: PropertyGroupsService;
    public readonly request: BaseHttpRequest;
    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
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
        this.changesets = new ChangesetsService(this.request);
        this.content = new ContentService(this.request);
        this.contentTypes = new ContentTypesService(this.request);
        this.oauth = new OauthService(this.request);
        this.packages = new PackagesService(this.request);
        this.propertyFormats = new PropertyFormatsService(this.request);
        this.propertyGroups = new PropertyGroupsService(this.request);
    }
}

