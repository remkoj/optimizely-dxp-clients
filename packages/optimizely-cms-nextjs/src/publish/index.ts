import { type NextRequest, NextResponse } from 'next/server.js'
import { revalidatePath, revalidateTag } from "next/cache.js"
import { type ClientFactory, type IOptiGraphClient, OptiCmsSchema, RouteResolver, type Route } from '@remkoj/optimizely-graph-client'
import { createAuthorizedClient } from '../client.js'

export { type NextRequest, NextResponse } from 'next/server.js'
export type PublishApiHandler = (req: NextRequest) => Promise<NextResponse<PublishApiResponse>> | NextResponse<PublishApiResponse>
export type PublishScopes = Parameters<typeof revalidatePath>[1]
export type DynamicScopes = NonNullable<Parameters<typeof revalidatePath>[1]>
export type PublishHookData = {
  timestamp: string
  tenantId: string
} & ({
  type: {
    subject: "bulk"
    action: string
  }
  data: {
    journalId: string
    items: {
      [itemId: string]: "indexed" | "deleted"
    }
    docId: never
  }
} | {
  type: {
    subject: "doc"
    action: string
  }
  data: {
    docId: string
    journalId: never
    items: never
  }
})

type PartialRouteResolver = {
  getContentInfoById: (...args: Parameters<InstanceType<(typeof RouteResolver)>['getContentInfoById']>) => Promise<undefined | Pick<Route, 'path'>>
}

export type PublishApiOptions = {
  /**
   * The list of paths that your implementation uses with Optimizely CMS
   * managed content. If the optimized publishing is enabled, this list will
   * not be used at all.
   */
  paths: Array<Parameters<typeof revalidatePath>[0]>

  /**
   * A list fo paths that must always be purged, regardless of optimization
   * of purging is enabled. This is normally used for search-results etc..
   */
  additionalPaths: Array<Parameters<typeof revalidatePath>[0]>

  /**
   * The scopes for which to revalidate the cache
   */
  scopes: Array<PublishScopes>

  /**
   * The scopes for which to revalidate the cache for dynamic routes
   */
  dynamicScopes: Array<DynamicScopes>

  /**
   * The tags to revalidate the cache for
   */
  tags: Parameters<typeof revalidateTag>[0] | Array<Parameters<typeof revalidateTag>[0]> | ((data: PublishHookData | null | undefined) => Promise<Array<Parameters<typeof revalidateTag>[0]>>)

  /**
   * If set to true, the handler will only publish the paths of the items
   * that are changed. However this comes at the expense of needing a GraphQL
   * query for every received hook to resolve the paths.
   */
  optimizePublish: boolean

  /**
   * The Optimizely Graph client to use for Graph Operations needed to publish 
   * content
   */
  client: ClientFactory | IOptiGraphClient

  /**
   * The router to use when the publishing optimization is enabled
   */
  router: (() => PartialRouteResolver) | { urlBase?: URL | string, resolverMode?: OptiCmsSchema }

  /**
   * A filtering function for the received webhooks, only hooks for which this method
   * returns true will trigger a cache invalidation.
   * 
   * @param hookType 
   * @returns 
   */
  hookDataFilter: (hookType: PublishHookData['type']) => boolean

  /**
   * Take the item identifier as reported by Optimizely Graph and turn that into a
   * key and locale. The default implementation assumes [key]_[locale]_[status]
   * 
   * @param       itemId      The Item ID to parse
   * @param       subject     The Hook Subject, to make the processing different for single or bulk. Typical values are "bulk" or "doc"
   * @returns     An array, with the first item being the key, second locale
   */
  itemIdToKeyAndLocale: (itemId: string, subject?: PublishHookData['type']['subject']) => { key: string, locale: string, version?: string, status?: string } | undefined

  /**
   * Basic filter for bulk operations, to only select those items in a bulk operation
   * that are actually needed for processing.
   * 
   * @param bulkItemStatus 
   * @returns 
   */
  bulkItemStatusFilter: (bulkItemStatus: string) => boolean
}

export type PublishApiResponse = {
  revalidated: {
    paths: Array<string | { path: string, scope: PublishScopes }>
    scopes?: Array<PublishScopes>
    tags: Array<Parameters<typeof revalidateTag>[0]>
  }
  optimized: boolean
  error?: never
} | { revalidated?: never, optimized?: boolean, error: string }

const publishApiDefaults: PublishApiOptions = {
  paths: ['/', '/[[...path]]', '/[lang]', '/[lang]/[[...path]]'],
  additionalPaths: [],
  scopes: [undefined, 'layout'],
  dynamicScopes: ['page', 'layout'],
  tags: [],
  optimizePublish: false,
  client: createAuthorizedClient,
  router: {},
  hookDataFilter: (hookType) => hookType.subject == 'bulk' && hookType.action == 'completed',
  bulkItemStatusFilter: (bulkItemStatus: string) => bulkItemStatus == "indexed" || bulkItemStatus == "deleted",
  itemIdToKeyAndLocale: (id) => {
    const idParts = id.split('_');

    // The version may or may not be in the ID, so parsing accordingly
    const [key, version, locale, status] = idParts.length >= 4 ?
      idParts :
      [idParts[0], undefined, idParts[1], idParts[2]];

    // Only return a value if we have both a key & locale
    if (key && locale)
      return { key: key.replaceAll('-', ''), locale, version, status }
    return undefined
  }
}

/**
 * Create the default handler for webhooks received from Optimizely Graph.
 * 
 * @param     options   The configuration fo the API
 * @returns   The created API Handler
 */
export function createPublishApi(options?: Partial<PublishApiOptions>): PublishApiHandler {
  const {
    paths,
    additionalPaths,
    optimizePublish,
    client: clientFactory,
    router: routerFactory,
    hookDataFilter,
    tags,
    scopes,
    dynamicScopes,
    itemIdToKeyAndLocale,
    bulkItemStatusFilter
  }: PublishApiOptions = {
    ...publishApiDefaults,
    ...options
  }

  function getRouteResolver(client: IOptiGraphClient): PartialRouteResolver {
    return typeof routerFactory == 'function' ? routerFactory() : new RouteResolver(client, routerFactory?.urlBase, routerFactory?.resolverMode ?? client.currentOptiCmsSchema)
  }

  function resolveTags(data: PublishHookData | null | undefined): Promise<Array<Parameters<typeof revalidateTag>[0]>> {
    if (typeof tags == 'function')
      return tags(data)
    if (Array.isArray(tags))
      return Promise.resolve(tags)
    return Promise.resolve([tags])
  }

  function isDynamic(path: string) {
    return path.indexOf("[") >= 0
  }

  function publishAll(targetPaths: string[], targetTags: Array<Parameters<typeof revalidateTag>[0]>, optimized: boolean = false, publishScopes: PublishScopes[] = scopes, dscopes: DynamicScopes[] = dynamicScopes): PublishApiResponse {
    const publishedPathAndScopes: { path: string, scope: PublishScopes }[] = []

    // Publish the paths targeted explicitly
    targetPaths.forEach(path => {
      const scopes = isDynamic(path) ? dscopes : publishScopes
      scopes.forEach(scope => {
        revalidatePath(path, scope)
        publishedPathAndScopes.push({ path, scope })
      })
    });

    // Publish the enforced paths
    additionalPaths.forEach(path => {
      const scopes = isDynamic(path) ? dscopes : publishScopes
      scopes.forEach(scope => {
        revalidatePath(path, scope)
        publishedPathAndScopes.push({ path, scope })
      })
    });

    // Publish the tags te published
    targetTags.forEach(tag => revalidateTag(tag, 'max'))

    // Build the outcome
    return { revalidated: { paths: publishedPathAndScopes, tags: targetTags }, optimized }
  }

  function getItemIds(hookData: PublishHookData): Array<{ key: string, locale: string }> {
    let items: Array<{ key: string, locale: string }> = []
    switch (hookData.type.subject) {
      case "doc":
        items = [hookData.data.docId]
          .map(item => itemIdToKeyAndLocale(item))
          .filter(x => x) as Array<{ key: string, locale: string }>
        break
      case "bulk":
        items = Object.getOwnPropertyNames(hookData.data.items ?? {}).map(pn => {
          const status = hookData.data.items[pn]
          if (bulkItemStatusFilter(status))
            return itemIdToKeyAndLocale(pn)
          return undefined
        }).filter(x => x) as Array<{ key: string, locale: string }>
        break;
      default:
        //@ts-expect-error All known types have been handled, this error is for new/unknown types
        throw new Error("Unknown hook subject " + hookData.type.subject)
    }
    return items.filter((x, i, a) => a.findIndex(v => v.key == x.key && v.locale == x.locale) == i)
  }

  const requestHandler: PublishApiHandler = async (req) => {
    // Validate the request
    const client = typeof (clientFactory) == 'object' ? clientFactory : clientFactory();
    const publishToken = client.siteInfo.publishToken
    const requestToken = getRequestToken(req)
    if (!publishToken) {
      console.error("[Publish-API] No authentication configured, publishing has been disabled")
      return NextResponse.json({ error: "Not authorized" }, { status: 401 })
    }
    if (!requestToken || requestToken != publishToken) {
      console.error("[Publish-API] The provided publishing token is invalid", requestToken)
      return NextResponse.json({ error: "Not authorized" }, { status: 401 })
    }

    try {
      // Get the webhook data
      const webhookData = await req.json().catch(() => undefined) as PublishHookData | null | undefined
      console.debug('[Publish-API] Webhook data', webhookData)

      // Resolve the tags related to this request
      const publishTags = await resolveTags(webhookData)
      console.debug('[Publish-API] Publishing tags', publishTags)

      // Purge everything if not known (e.g. for a GET request)
      if (!webhookData) {
        console.error("[Publish-API] No hook data received, optimization disabled")
        const responseData = publishAll(paths, publishTags);
        console.debug("[Publish-API] Publish result:", JSON.stringify(responseData))
        return NextResponse.json(responseData)
      }

      // Make sure we're allowed to process the hook
      if (!hookDataFilter(webhookData.type)) {
        console.log("[Publish-API] Webhook ignored due to hookDataFilter", webhookData.type)
        return NextResponse.json({ optimized: false, revalidated: { paths: [], tags: [] } })
      }

      // If we're not optimizing, just publish everything
      if (!optimizePublish) {
        const responseData = publishAll(paths, publishTags);
        console.debug("[Publish-API] Publish result:", JSON.stringify(responseData))
        return NextResponse.json(responseData)
      }

      // Get the actual content ids from the hook data
      const contentIds = getItemIds(webhookData)
      console.debug("[Publish-API] Content items to publish:", JSON.stringify(contentIds))

      // Resolve the contentids to paths
      const router = getRouteResolver(client)
      const results = await Promise.allSettled(contentIds.map(contentId => router.getContentInfoById(contentId.key, contentId.locale)))
      const pathsToFlush = results.map(result => {
        if (result.status == "rejected") {
          console.error("[Publish-API] Error fetching route for content item:", (result.reason as Error)?.message ?? result.reason)
          return undefined
        }
        return result.value?.path
      }).filter(x => x) as Array<string>
      console.debug("[Publish-API] Content paths to publish:", JSON.stringify(pathsToFlush))

      // Flush these paths
      const responseData = publishAll(pathsToFlush, publishTags, true);
      console.debug("[Publish-API] Publish result:", JSON.stringify(responseData))
      return NextResponse.json(responseData)
    } catch (e) {
      console.error("[Publish-API] Error handling publishing request", (e as Error)?.message ?? e)
      return NextResponse.json({ error: (e as Error)?.message ?? "Unknown error " }, { status: 500 })
    }
  }

  return requestHandler
}

function getRequestToken(req: NextRequest): string | undefined {
  return req.headers.get("X-OPTLY-PUBLISH") ??
    req.nextUrl.searchParams.get("token") ??
    undefined
}

export default createPublishApi
