'use server'

import { type IOptiGraphClient } from "@remkoj/optimizely-graph-client/client";
import { type IRouteResolver } from "@remkoj/optimizely-graph-client/router";
import { type ChannelDefinition, ifChannelDefinition } from "@remkoj/optimizely-graph-client/channels";

import { getChannelId, type LookupResponse } from "./_base.js";
import { localeToGraphLocale } from "./utils.js";

// Helper function to obtain the info by path
export async function getInfoByPath(
  client: IOptiGraphClient,
  routerFactory: (client?: IOptiGraphClient) => IRouteResolver,
  requestPath: string,
  channel?: ChannelDefinition | string
) {
  if (client.debug)
    console.log(
      `⚪ [CmsPage.getInfoByPath] Loading content for path "${requestPath}" using RouteResolver`
    )
  const channelId = getChannelId(client, channel)
  const router = routerFactory(client)
  const route = await router.getContentInfoByPath(requestPath, channelId)
  if (!route) {
    if (client.debug)
      console.warn(
        `🟠 [CmsPage.getInfoByPath] The RouteResolver was unable to resolve the route information for "${requestPath}"`
      )
    return undefined
  }
  const contentLink = router.routeToContentLink(route)
  const contentType = route.contentType
  const graphLocale = localeToGraphLocale(route.locale, ifChannelDefinition(channel))
  return [route, contentLink, contentType, graphLocale, null] as LookupResponse
}