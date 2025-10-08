import * as GetAllRoutes from './getAllRoutes.js'
import * as GetRouteById from './getRouteById.js'
import * as GetRouteByPath from './getRouteByPath.js'
import type { Route as GraphRoute } from './types.js'
import type { Route } from '../../types.js'
import { type IOptiGraphClient as GraphQLClient } from '../../../../client/types.js'
import { type OptimizelyCmsRoutingApi } from '../types.js'

export class OptimizelyCms13Client implements OptimizelyCmsRoutingApi {
  private _changeset: string | null = null

  enablePreview(changeset: string = "default"): void {
    this._changeset = changeset
  }

  disablePreview(): void {
    this._changeset = null
  }

  async getRoutes(client: GraphQLClient, siteId?: string, onlyWithDomain?: boolean, includeVariants?: boolean): Promise<Route[]> {
    if (client.debug)
      console.log(`⚪ [RouteResolver] Loading routes for ${siteId ?? 'all applications'}${!siteId && onlyWithDomain ? ' that have a domain defined.' : ''}`)

    let totalRoutes: number = 0
    let retrievedRoutes: number = 0
    let currentPage: number = 0
    let pageSize: number = 100
    const graphRoutes: GraphRoute[] = []

    do {
      if (client.debug)
        console.log(`⚪ [RouteResolver] Fetching page ${currentPage + 1} with ${pageSize} routes, of ${totalRoutes > 0 ? Math.ceil(totalRoutes / pageSize) : 'unknown'}`)
      const page = await client.request<GetAllRoutes.Result, GetAllRoutes.Variables>(GetAllRoutes.query, {
        domain: siteId,
        mustHaveDomain: onlyWithDomain ? true : null,
        pageSize: pageSize,
        skip: currentPage * pageSize,
        changeset: this._changeset || client.getChangeset(),
        variation: includeVariants ? { include: "ALL" } : undefined
      }).catch(e => {
        if (client.debug)
          console.error("🔴 [RouteResolver] Error while fetching routes", e)
        return undefined
      })

      if (page) {
        totalRoutes = page.Content.total
        retrievedRoutes = page.Content.items.length
        graphRoutes.push(...page.Content.items)
        currentPage++
      } else {
        totalRoutes = 0
        retrievedRoutes = 0
      }
    } while (totalRoutes > 0 && retrievedRoutes > 0 && graphRoutes.length < totalRoutes && retrievedRoutes == pageSize)

    return graphRoutes.map(this.tryConvertResponse.bind(this)).filter(this.isNotNullOrUndefined)
  }

  async getRouteByPath(client: GraphQLClient, path: string, siteId?: string, variant?: string): Promise<undefined | Route> {
    if (client.debug)
      console.log(`⚪ [RouteResolver] Resolving content info for ${path} on ${siteId ? siteId : "all domains"}`)

    const paths = [path, path.endsWith('/') ? path.substring(0, path.length - 1) : path + '/'].filter(p => p)

    const resultSet = await client.request<GetRouteByPath.Result, GetRouteByPath.Variables>({
      document: GetRouteByPath.query,
      variables: {
        path: paths,
        domain: siteId,
        changeset: this._changeset || client.getChangeset(),
        variation: variant && variant.length > 0 ? { include: "SOME", value: [variant] } : undefined
      }
    })

    if ((resultSet.getRouteByPath?.total ?? 0) === 0) {
      if (client.debug)
        console.warn("🟠 [RouteResolver] No items in the resultset");
      return undefined
    }

    if ((resultSet.getRouteByPath?.total ?? 0) > 1) {
      if (client.debug)
        console.warn("🟠 [RouteResolver] Ambiguous URL provided - picking first match, did you omit the domain in a multi-site setup?")
    }

    if (client.debug)
      console.log(`⚪ [RouteResolver] Resolved content info for ${path} to: ${JSON.stringify(resultSet.getRouteByPath.items)}`)

    return this.convertResponse(resultSet.getRouteByPath.items)
  }

  async getRouteById(client: GraphQLClient, contentId: string, locale: string, version: string | number): Promise<undefined | Route> {
    const variables: GetRouteById.Variables = { key: contentId, version: version?.toString(), locale: locale?.replaceAll('-', '_'), changeset: this._changeset || client.getChangeset() }

    if (client.debug)
      console.log("⚪ [RouteResolver] Resolving content by id:", JSON.stringify(variables))

    const resultSet = await client.request<GetRouteById.Result, GetRouteById.Variables>({
      document: GetRouteById.query,
      variables
    })

    if (resultSet.Content?.total >= 1) {
      let selectedItem = resultSet.Content.items[0]
      if (client.debug && resultSet.Content?.total > 1) {
        let firstEmptyVariantItem = resultSet.Content?.items?.filter(x => x._metadata?.variation === null || x._metadata?.variation === undefined)?.at(0)
        selectedItem = firstEmptyVariantItem ?? selectedItem
      }
      console.warn(`🟠 [RouteResolver] Received multiple entries with this ID, returning the first default variant from: ${(resultSet.Content?.items || []).map(x => { return `${x._metadata.key} (version: ${x._metadata.version}, locale: ${x._metadata.locale}, changeset: ${x._metadata.changeset}, variant: ${x._metadata.variation})` }).join('; ')}`)
      return this.convertResponse(selectedItem)
    }

    return undefined
  }

  private convertResponse(item: GraphRoute): Route {
    if (!item)
      throw new Error("RouteResolver.convertResponse(): mandatory parameter \"item\" not provided!")
    const itemUrl = new URL(item._metadata?.url?.path ?? '/', item._metadata?.url?.domain ?? 'https://example.com')
    return {
      locale: item._metadata.locale,
      path: item._metadata.url.path,
      url: itemUrl,
      slug: item._metadata?.slug ?? "",
      changed: item.changed ? new Date(item.changed) : null,
      contentType: item._metadata.types,
      version: item._metadata.version,
      key: item._metadata.key,
      changeset: item._metadata.changeset,
      variation: item._metadata.variation
    }
  }

  private tryConvertResponse(item: GraphRoute): Route | undefined {
    try {
      return this.convertResponse(item)
    } catch (e) {
      console.error(`🔴 [RouteResolver] Unable to convert ${JSON.stringify(item)} to Route`, e)
      return undefined
    }
  }

  private isNotNullOrUndefined<T>(input: T | null | undefined): input is T {
    return input != null && input != undefined
  }
}

export default OptimizelyCms13Client