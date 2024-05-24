import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { ChangesetsService } from './services/ChangesetsService';
import { ContentService } from './services/ContentService';
import { ContentTypesService } from './services/ContentTypesService';
import { DisplayTemplatesService } from './services/DisplayTemplatesService';
import { OauthService } from './services/OauthService';
import { PackagesService } from './services/PackagesService';
import { PropertyFormatsService } from './services/PropertyFormatsService';
import { PropertyGroupsService } from './services/PropertyGroupsService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export declare class CmsIntegrationApiClient {
    readonly changesets: ChangesetsService;
    readonly content: ContentService;
    readonly contentTypes: ContentTypesService;
    readonly displayTemplates: DisplayTemplatesService;
    readonly oauth: OauthService;
    readonly packages: PackagesService;
    readonly propertyFormats: PropertyFormatsService;
    readonly propertyGroups: PropertyGroupsService;
    readonly request: BaseHttpRequest;
    constructor(config?: Partial<OpenAPIConfig>, HttpRequest?: HttpRequestConstructor);
}
export {};
