/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';
import { ApplicationsService } from './services/ApplicationsService';
import { BlueprintsService } from './services/BlueprintsService';
import { ContentService } from './services/ContentService';
import { ContentSourcesService } from './services/ContentSourcesService';
import { ContentTypeBindingsService } from './services/ContentTypeBindingsService';
import { ContentTypesService } from './services/ContentTypesService';
import { DisplayTemplatesService } from './services/DisplayTemplatesService';
import { LocalesService } from './services/LocalesService';
import { ManifestService } from './services/ManifestService';
import { PropertyFormatsService } from './services/PropertyFormatsService';
import { PropertyGroupsService } from './services/PropertyGroupsService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class CmsIntegrationApiClient {
    public readonly applications: ApplicationsService;
    public readonly blueprints: BlueprintsService;
    public readonly content: ContentService;
    public readonly contentSources: ContentSourcesService;
    public readonly contentTypeBindings: ContentTypeBindingsService;
    public readonly contentTypes: ContentTypesService;
    public readonly displayTemplates: DisplayTemplatesService;
    public readonly locales: LocalesService;
    public readonly manifest: ManifestService;
    public readonly propertyFormats: PropertyFormatsService;
    public readonly propertyGroups: PropertyGroupsService;
    public readonly request: BaseHttpRequest;
    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? 'https://api.cms.optimizely.com/v1',
            VERSION: config?.VERSION ?? '1',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });
        this.applications = new ApplicationsService(this.request);
        this.blueprints = new BlueprintsService(this.request);
        this.content = new ContentService(this.request);
        this.contentSources = new ContentSourcesService(this.request);
        this.contentTypeBindings = new ContentTypeBindingsService(this.request);
        this.contentTypes = new ContentTypesService(this.request);
        this.displayTemplates = new DisplayTemplatesService(this.request);
        this.locales = new LocalesService(this.request);
        this.manifest = new ManifestService(this.request);
        this.propertyFormats = new PropertyFormatsService(this.request);
        this.propertyGroups = new PropertyGroupsService(this.request);
    }
}

