import * as GetAllRoutes from './getAllRoutes.js'
import * as GetRouteById from './getRouteById.js'
import * as GetRouteByPath from './getRouteByPath.js'
import type { Route } from '../../types.js'
import { type IOptiGraphClient as GraphQLClient } from '../../../../client/types.js'
import { type OptimizelyCmsRoutingApi } from '../types.js'
import { AnyContentLink } from '../../../types.js'

export class OptimizelyCms12Client implements OptimizelyCmsRoutingApi {

  enablePreview(): void {
    throw new Error("The CMS 12 implementation does not support preview mode")
  }

  disablePreview(): void {
    throw new Error("The CMS 12 implementation does not support preview mode")
  }

  async getRoutes(client: GraphQLClient, siteId?: string): Promise<Route[]> {
    client.updateFlags({ queryCache: false/*, cache: false*/ }, true)
    let page = await client.request<GetAllRoutes.Result, GetAllRoutes.Variables>(GetAllRoutes.query, { siteId, typeFilter: "Page" })
    let results = page?.Content?.items ?? []
    const totalCount = page?.Content?.total ?? 0
    const cursor = page?.Content?.cursor ?? ''

    if (totalCount > 0 && cursor !== '' && totalCount > results.length)
      while ((page?.Content?.items?.length ?? 0) > 0 && results.length < totalCount) {
        page = await client.request<GetAllRoutes.Result, GetAllRoutes.Variables>({
          document: GetAllRoutes.query,
          variables: {
            cursor,
            siteId,
            typeFilter: "Page"
          }
        })
        results = results.concat(page.Content?.items ?? [])
      }

    client.restoreFlags()
    return results.map(this.tryConvertResponse.bind(this)).filter(this.isNotNullOrUndefined)
  }

  async getRouteByPath(client: GraphQLClient, path: string, siteId?: string): Promise<undefined | Route> {
    if (client.debug)
      console.log(`Resolving content info for ${path} on ${siteId ? "site " + siteId : "all sites"}`)

    const resultSet = await client.request<GetRouteByPath.Result, GetRouteByPath.Variables>({
      document: GetRouteByPath.query,
      variables: {
        path,
        siteId
      }
    })

    if ((resultSet.Content?.items?.length ?? 0) === 0) {
      if (client.debug) console.warn("No items in the resultset");
      return undefined
    }

    if ((resultSet.Content?.items?.length ?? 0) > 1)
      throw new Error("Ambiguous URL provided, did you omit the siteId in a multi-channel setup?")

    if (client.debug)
      console.log(`Resolved content info for ${path} to:`, resultSet.Content.items[0])

    return this.convertResponse(resultSet.Content.items[0])
  }
  async getRouteById(client: GraphQLClient, contentId: string, locale: string, version: string | number): Promise<undefined | Route> {
    const [id, workId] = this.parseIdString(contentId)
    const variables: GetRouteById.Variables = {
      id,
      workId,
      locale: locale.replaceAll('-', '_')
    }

    if (client.debug)
      console.log("Resolving content by id:", JSON.stringify(variables))

    const resultSet = await client.request<GetRouteById.Result, GetRouteById.Variables>({
      document: GetRouteById.query,
      variables
    })

    if (resultSet.Content?.total >= 1) {
      if (client.debug && resultSet.Content?.total > 1)
        console.warn(`Received multiple entries with this ID, returning the first one from: ${(resultSet.Content?.items || []).map(x => { return `${x.contentLink.id}_${x.contentLink.workId}_${x.locale.name}` }).join('; ')}`)
      return this.convertResponse(resultSet.Content.items[0])
    }

    return undefined
  }
  async getRouteByLink(client: GraphQLClient, contentLink: AnyContentLink): Promise<undefined | Route> {
    throw new Error("Not supported on CMS 12")
  }

  protected parseIdString(id: string): [number, number | null] {
    let cId: number = -1
    let workId: number | null = null
    if (id.indexOf("_") > 0) {
      [cId, workId] = id.split("_").map(x => {
        try {
          return Number.parseInt(x, 10)
        } catch {
          return -1
        }
      })
      if (workId < 0)
        workId = null
    } else {
      try {
        cId = Number.parseInt(id, 10)
      } catch {
        cId = -1
      }
    }
    return [cId, workId]
  }

  protected convertResponse(item: GetAllRoutes.Route): Route {
    return {
      // Take the GQL response
      ...item,

      // Then add/override the needed fields
      url: new URL(item.url),
      key: item.contentLink?.guidValue || "",
      version: item.contentLink?.workId?.toString(),
      locale: item.locale.name,
      changed: item.changed ? new Date(item.changed) : null
    }
  }

  protected tryConvertResponse(item: GetAllRoutes.Route): Route | undefined {
    try {
      return this.convertResponse(item)
    } catch (e) {
      console.error(`Unable to convert ${JSON.stringify(item)} to Route`, e)
      return undefined
    }
  }

  protected isNotNullOrUndefined<T>(input: T | null | undefined): input is T {
    return input != null && input != undefined
  }
}

export default OptimizelyCms12Client