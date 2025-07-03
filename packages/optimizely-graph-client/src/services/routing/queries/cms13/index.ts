import * as GetAllRoutes from './getAllRoutes.js'
import * as GetRouteById from './getRouteById.js'
import * as GetRouteByPath from './getRouteByPath.js'
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

  async getRoutes(client: GraphQLClient, siteId?: string): Promise<Route[]> {
    client.updateFlags({ queryCache: false/*, cache: false*/ }, true)
    const variables: GetAllRoutes.Variables = { domain: siteId, changeset: this._changeset || client.getChangeset() }
    if (client.debug)
      console.log("⚪ [RouteResolver] Fetching all routes with filters:", JSON.stringify(variables))
    let page = await client.request<GetAllRoutes.Result, GetAllRoutes.Variables>(GetAllRoutes.query, variables).catch(e => {
      if (client.debug)
        console.error("🔴 [RouteResolver] Error while fetching routes", e)
      return undefined
    })
    let results = page?.Content?.items ?? []
    const totalCount = page?.Content?.total ?? 0
    const cursor = page?.Content?.cursor ?? ''

    if (totalCount > 0 && cursor !== '' && totalCount > results.length)
      while ((page?.Content?.items?.length ?? 0) > 0 && results.length < totalCount) {
        page = await client.request<GetAllRoutes.Result, GetAllRoutes.Variables>({
          document: GetAllRoutes.query,
          variables: {
            cursor,
            domain: siteId
          }
        })
        results = results.concat(page.Content?.items ?? [])
      }

    client.restoreFlags()
    return results.map(this.tryConvertResponse.bind(this)).filter(this.isNotNullOrUndefined)
  }

  async getRouteByPath(client: GraphQLClient, path: string, siteId?: string): Promise<undefined | Route> {
    const variables: GetRouteByPath.Variables = { path: path, domain: siteId, changeset: this._changeset || client.getChangeset() }
    if (client.debug)
      console.log("⚪ [RouteResolver] Resolving content by path:", JSON.stringify(variables))

    const resultSet = await client.request<GetRouteByPath.Result, GetRouteByPath.Variables>({
      document: GetRouteByPath.query,
      variables
    })

    if ((resultSet.getRouteByPath?.items?.length ?? 0) === 0) {
      if (client.debug)
        console.warn("🟠 [RouteResolver] No items in the resultset");
      return undefined
    }

    if ((resultSet.getRouteByPath?.items?.length ?? 0) > 1)
      throw new Error("🔴 [RouteResolver] Ambiguous URL provided, did you omit the domain in a multi-site setup?")

    if (client.debug)
      console.log(`⚪ [RouteResolver] Resolved content info for ${path} to: ${JSON.stringify(resultSet.getRouteByPath.items[0])}`)

    return this.convertResponse(resultSet.getRouteByPath.items[0])
  }

  async getRouteById(client: GraphQLClient, contentId: string, locale: string, version: string | number): Promise<undefined | Route> {
    const variables: GetRouteById.Variables = {
      key: contentId,
      version: version?.toString(),
      locale: locale?.replaceAll('-', '_'),
      changeset: this._changeset || client.getChangeset()
    }

    if (client.debug)
      console.log("⚪ [RouteResolver] Resolving content by id:", JSON.stringify(variables))

    const resultSet = await client.request<GetRouteById.Result, GetRouteById.Variables>({
      document: GetRouteById.query,
      variables
    })

    if (resultSet.Content?.total >= 1) {
      if (client.debug && resultSet.Content?.total > 1)
        console.warn(`🟠 [RouteResolver] Received multiple entries with this ID, returning the first one from: ${(resultSet.Content?.items || []).map(x => { return `${x._metadata.key} (version: ${x._metadata.version}, locale: ${x._metadata.locale})` }).join('; ')}`)
      return this.convertResponse(resultSet.Content.items[0])
    }

    return undefined
  }

  private convertResponse(item: GetAllRoutes.Route): Route {
    if (!item)
      throw new Error("RouteResolver.convertResponse(): mandatory parameter \"item\" not provided!")
    const itemUrl = new URL(item._metadata?.url?.path ?? '/', item._metadata?.url?.domain ?? 'https://example.com')
    return {
      locale: item._metadata.locale,
      path: item._metadata.url.path,
      url: itemUrl,
      slug: item._metadata?.slug ?? "",
      changed: item.changed ? new Date(item.changed) : null,
      contentType: item._metadata.types.reverse(),
      version: item._metadata.version,
      key: item._metadata.key
    }
  }

  private tryConvertResponse(item: GetAllRoutes.Route): Route | undefined {
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