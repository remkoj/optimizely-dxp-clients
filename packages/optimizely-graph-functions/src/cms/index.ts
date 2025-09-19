import type { IntegrationApi, CmsIntegrationApiClient, CmsIntegrationApiOptions } from "@remkoj/optimizely-cms-api";
import { createClient, isClientInstance } from "@remkoj/optimizely-cms-api";
import { hasher as createHasher } from 'node-object-hash';
import { lcFirst, trimStart, ucFirst } from '../tools'

var hasher = createHasher({ sort: true, coerce: true });
const clientByHash = new Map<string, Promise<CmsIntegrationApiClient>>();
function getClient(config?: CmsIntegrationApiOptions): Promise<CmsIntegrationApiClient> {
  const configHash = hasher.hash(config ?? {})
  let client = clientByHash.get(configHash);
  if (!client) {
    client = new Promise((resolve, reject) => {
      const cms_client = createClient(config);
      cms_client.getInstanceInfo().then(() => {
        resolve(cms_client)
      }).catch(e => {
        reject(e)
      })
    })
    clientByHash.set(configHash, client)
  }
  return client
}

export function contentTypeToFragmentName(contentType: IntegrationApi.ContentType, forProperty: boolean = false): string | undefined {
  const contentTypeKey = contentType.key
  const contentTypeBase = forProperty ? ucFirst(trimStart(contentType.baseType ?? '', '_')) : 'Property'
  if (!contentTypeKey)
    return undefined
  return contentTypeKey + '_' + contentTypeBase + 'Data'
}

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

export async function getContentType(contentTypeKey: string, clientOrConfig?: CmsIntegrationApiClient | CmsIntegrationApiOptions): Promise<IntegrationApi.ContentType | undefined> {
  const client = isClientInstance(clientOrConfig) ? clientOrConfig : await getClient(clientOrConfig)
  const contentType = await client.contentTypesGet({ path: { key: contentTypeKey } }).catch(() => undefined)
  return contentType
}

export type ContentTypeFilter = (contentType: IntegrationApi.ContentType) => Promise<boolean> | boolean
const DefaultContentTypeFilter: ContentTypeFilter = () => true

/**
 * Retrieve all content types as an Async Generator, allowing processing of entries whilest they are being loaded from the CMS instance.
 * 
 * @param clientOrConfig 
 * @param pageSize 
 * @param filter
 */
export async function* getAllContentTypes(clientOrConfig?: CmsIntegrationApiClient | CmsIntegrationApiOptions, pageSize: number = 25, filter: ContentTypeFilter = DefaultContentTypeFilter): AsyncGenerator<IntegrationApi.ContentType> {
  const client = isClientInstance(clientOrConfig) ? clientOrConfig : await getClient(clientOrConfig)
  let requestPageSize = pageSize;
  let requestPageIndex = 0
  let totalItemCount = 0
  let totalPages = 0
  do {
    const resultsPage = await client.contentTypesList({ query: { pageIndex: requestPageIndex, pageSize: requestPageSize } }).catch((_) => {
      return {
        items: [],
        totalItemCount: 0,
        pageIndex: requestPageIndex,
        pageSize: requestPageSize
      } as IntegrationApi.ContentTypePage
    });

    // Calculate fields for next page
    totalItemCount = resultsPage.totalItemCount ?? 0;
    requestPageSize = resultsPage.pageSize ?? 0;
    requestPageIndex = (resultsPage.pageIndex ?? 0) + 1;
    totalPages = resultsPage.totalItemCount && resultsPage.pageSize ? Math.ceil(totalItemCount / requestPageSize) : 0

    // Yield items
    for (const contentType of (resultsPage.items ?? [])) {
      if (await filter(contentType))
        yield contentType
    }

  } while (requestPageIndex < totalPages)
}

