import type { Route } from '../types.js'
import { type IOptiGraphClient as GraphQLClient } from '../../../client/types.js'

export interface OptimizelyCmsRoutingApi {
    getRoutes(client: GraphQLClient, siteId?: string) : Promise<Route[]>
    getRouteByPath(client: GraphQLClient, path: string, siteId?: string) : Promise<undefined | Route>
    getRouteById(client: GraphQLClient, contentId: string, locale?: string, version?: string | number) : Promise<undefined | Route>
}