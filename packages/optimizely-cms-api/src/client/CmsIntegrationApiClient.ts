/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';
import { BlueprintsService } from './services/BlueprintsService';
import { ChangesetsService } from './services/ChangesetsService';
import { ContentService } from './services/ContentService';
import { ContentTypesService } from './services/ContentTypesService';
import { DisplayTemplatesService } from './services/DisplayTemplatesService';
import { PropertyFormatsService } from './services/PropertyFormatsService';
import { PropertyGroupsService } from './services/PropertyGroupsService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class CmsIntegrationApiClient {
    public readonly blueprints: BlueprintsService;
    public readonly changesets: ChangesetsService;
    public readonly content: ContentService;
    public readonly contentTypes: ContentTypesService;
    public readonly displayTemplates: DisplayTemplatesService;
    public readonly propertyFormats: PropertyFormatsService;
    public readonly propertyGroups: PropertyGroupsService;
    public readonly request: BaseHttpRequest;
    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? 'https://api.cms.optimizely.com/preview3',
            VERSION: config?.VERSION ?? 'preview3',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });
        this.blueprints = new BlueprintsService(this.request);
        this.changesets = new ChangesetsService(this.request);
        this.content = new ContentService(this.request);
        this.contentTypes = new ContentTypesService(this.request);
        this.displayTemplates = new DisplayTemplatesService(this.request);
        this.propertyFormats = new PropertyFormatsService(this.request);
        this.propertyGroups = new PropertyGroupsService(this.request);
    }
}

