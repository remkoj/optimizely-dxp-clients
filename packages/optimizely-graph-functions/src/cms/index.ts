import { IntegrationApi, CmsIntegrationApiClient, CmsIntegrationApiOptions } from "@remkoj/optimizely-cms-api";
import { createClient, isClientInstance } from "@remkoj/optimizely-cms-api";
import { hasher as createHasher } from 'node-object-hash';
import { lcFirst, trimStart, ucFirst } from '../tools'

/**
 * Build the conventional fragment name for a content type's data fragment.
 *
 * @param contentType  The content type definition
 * @param forProperty  When `true`, uses the property-variant naming convention
 * @returns            Fragment name (e.g. `HeroBlock_ComponentData`) or `undefined` when the key is absent
 */
export function contentTypeToFragmentName(contentType: IntegrationApi.ContentType, forProperty: boolean = false): string | undefined {
  const contentTypeKey = contentType.key
  const contentTypeBase = forProperty ? ucFirst(trimStart(contentType.baseType ?? '', '_')) : 'Property'
  if (!contentTypeKey)
    return undefined
  return contentTypeKey + '_' + contentTypeBase + 'Data'
}

/**
 * Reverse-parse a fragment name back into its content type information.
 *
 * @param fragmentName  A fragment name following the `<Key>_<BaseType>Data` convention
 * @returns             `{ contentType, baseType, forProperty }` extracted from the name
 * @throws              When the name does not match the expected pattern
 */
export function fragmentNameToContentType(fragmentName: string): { contentType: string, baseType: string, forProperty: boolean } {
  const result = fragmentName.match(/^([A-Za-z][_0-9A-Za-z]+?)(_([A-Za-z][0-9A-Za-z]+)|_){0,1}Data$/)
  const contentTypeKey = result?.at(1)?.endsWith('Property') ? result.at(1)?.substring(0, Math.max((result.at(1)?.length ?? 0) - 8, 0)) : result?.at(1)
  const contentTypeBase = (result?.at(3) === 'Property' ? 'Component' : result?.at(3)) ?? 'Component'
  if (!contentTypeKey)
    throw new Error("Unable to determine ContentType from fragment: " + fragmentName)
  const forProperty = (result?.at(3) === 'Property' || (!result?.at(3) && result?.at(1)?.endsWith('Property'))) || false
  return {
    contentType: contentTypeKey,
    baseType: '_' + lcFirst(contentTypeBase),
    forProperty
  }
}

/** Predicate used to include or exclude content types during a listing operation. */
export type ContentTypeFilter = (contentType: IntegrationApi.ContentType) => Promise<boolean> | boolean
const DefaultContentTypeFilter: ContentTypeFilter = () => true

/**
 * Async generator that pages through all content types from the CMS, yielding
 * each one as it arrives. Enables processing entries while the next page is
 * still being fetched.
 *
 * @param clientOrConfig  CMS client instance or connection options
 * @param pageSize        Number of items to fetch per request (default: 25)
 * @param filter          Optional predicate; only matching types are yielded
 */
async function* getAllContentTypes(clientOrConfig?: CmsIntegrationApiClient | CmsIntegrationApiOptions, pageSize: number = 25, filter: ContentTypeFilter = DefaultContentTypeFilter): AsyncGenerator<IntegrationApi.ContentType> {
  const client = isClientInstance(clientOrConfig) ? clientOrConfig : await getClient(clientOrConfig)
  let requestPageSize = pageSize;
  let requestPageIndex = 0;
  let totalItemCount : number;
  let totalPages : number;
  do {
    const resultsPage = await client.contentTypesList({ query: { pageIndex: requestPageIndex, pageSize: requestPageSize } }).catch(() => {
      return {
        items: [],
        totalItemCount: 0,
        totalCount: 0,
        pageIndex: requestPageIndex,
        pageSize: requestPageSize
      } as IntegrationApi.ContentTypePage
    });

    // Calculate fields for next page
    // @ts-expect-error Difference between PaaS & SaaS
    totalItemCount = resultsPage.totalItemCount ?? resultsPage.totalCount ?? 0;
    requestPageSize = resultsPage.pageSize ?? 0;
    requestPageIndex = (resultsPage.pageIndex ?? 0) + 1;
    totalPages = totalItemCount && resultsPage.pageSize ? Math.ceil(totalItemCount / requestPageSize) : 0

    // Yield items
    for (const contentType of (resultsPage.items ?? [])) {
      if (await filter(contentType))
        yield contentType
    }

  } while (requestPageIndex < totalPages)
}

/** Collect all content types from `getAllContentTypes` into a `Map` keyed by content type key. */
async function getAllContentTypesMap(clientOrConfig?: CmsIntegrationApiClient | CmsIntegrationApiOptions, pageSize: number = 25, filter: ContentTypeFilter = DefaultContentTypeFilter): Promise<Map<string, IntegrationApi.ContentType>>
{
  const contentTypeMap : Map<string, IntegrationApi.ContentType> = new Map();
  const allContentTypes = getAllContentTypes(clientOrConfig, pageSize, filter);
  for await (const ct of allContentTypes) {
    if (ct.key) contentTypeMap.set(ct.key, ct)
  }
  return contentTypeMap
}

const hasher = createHasher({ sort: true, coerce: true });
const clientByHash = new Map<string, Promise<CmsIntegrationApiClient>>();
const contentTypeList = new Map<string, Promise<Map<string, IntegrationApi.ContentType>>>();

/**
 * Return a cached `Promise<Map<string, ContentType>>` for the given client/config,
 * optionally filtered. Results are cached by a hash of the configuration object
 * to avoid duplicate API calls across the codegen run.
 *
 * @param configOrClient  CMS client instance or connection options (reads from env when omitted)
 * @param filter          Optional predicate to restrict the returned types
 */
export async function getContentTypes(configOrClient?: CmsIntegrationApiOptions | CmsIntegrationApiClient, filter?: ContentTypeFilter): Promise<Map<string, IntegrationApi.ContentType>>
{
  const config = (isClientInstance(configOrClient) ? (configOrClient as CmsIntegrationApiClient & {_config: CmsIntegrationApiOptions})._config : configOrClient);
  const hash = hasher.hash(config ?? {});
  let list = contentTypeList.get(hash);
  if (!list) {
    list = getAllContentTypesMap(configOrClient, 100);
    contentTypeList.set(hash, list);
  }
  if (filter) {
    const contentTypeMap = await list;
    const filteredMap = new Map<string, IntegrationApi.ContentType>();
    contentTypeMap.forEach((contentType, contentTypeKey) => {
      if (filter(contentType)) filteredMap.set(contentTypeKey, contentType);
    });
    return filteredMap;
  }
  return list
}

/**
 * Convenience wrapper around `getContentTypes` that resolves to an array
 * instead of a `Map`.
 */
export async function getContentTypesList(configOrClient?: CmsIntegrationApiOptions | CmsIntegrationApiClient, filter?: ContentTypeFilter): Promise<Array<IntegrationApi.ContentType>>
{
  const types = await getContentTypes(configOrClient, filter);
  return Array.from(types.values());
}

/**
 * Look up a single content type by key from the cached type map.
 * Returns `undefined` when the key is not found.
 */
export async function getContentType(contentTypeKey: string, clientOrConfig?: CmsIntegrationApiClient | CmsIntegrationApiOptions): Promise<IntegrationApi.ContentType | undefined> {
  const types = await getContentTypes(clientOrConfig);
  return types.get(contentTypeKey);
}

/**
 * Create or retrieve a cached `CmsIntegrationApiClient` for the given config.
 * Validates the connection by performing a lightweight API call before resolving.
 * Rejects when the CMS instance is unreachable or credentials are invalid.
 */
function getClient(config?: CmsIntegrationApiOptions): Promise<CmsIntegrationApiClient> {
  const configHash = hasher.hash(config ?? {})
  let client = clientByHash.get(configHash);
  if (!client) {
    client = new Promise((resolve, reject) => {
      const cms_client = createClient(config);
      cms_client.propertyGroupsList({}).then(() => {
        resolve(cms_client)
      }).catch(e => {
        reject(new Error('Unable to connect', { cause: e }))
      })
    })
    clientByHash.set(configHash, client)
  }
  return client
}
