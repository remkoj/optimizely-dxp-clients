'use server'

import { type IOptiGraphClient } from "@remkoj/optimizely-graph-client";
import { type ChannelDefinition, ifChannelDefinition } from "@remkoj/optimizely-graph-client/channels";
import { normalizeContentLinkWithLocale, isContentLinkWithSetLocale } from '@remkoj/optimizely-graph-client/utils';

import { Utils } from '@remkoj/optimizely-cms-react/rsc';

import { type GetContentByPathMethod, type GetContentByPathVariables, } from './data.js';
import { getChannelId, SystemLocales, type LookupResponse } from "./_base.js";
import { localeToGraphLocale } from './utils.js'

export async function loadContentByPath<LocaleEnum = SystemLocales>(
  client: IOptiGraphClient,
  getContentByPath: GetContentByPathMethod<LocaleEnum>,
  requestPath: string,
  channel?: ChannelDefinition | string,
  locale?: LocaleEnum | LocaleEnum[]
): Promise<LookupResponse | undefined | null> {
  if (client.debug)
    console.log(
      `⚪ [CmsPage.loadContentByPath] Loading content for path "${requestPath}" using getContentByPath method`
    )
  const channelId = getChannelId(client, channel)
  const pathForRequest = [
    requestPath,
    requestPath.endsWith('/')
      ? requestPath.substring(0, requestPath.length - 1)
      : requestPath + '/',
  ].filter((x) => x)

  const requestVars: GetContentByPathVariables<LocaleEnum> = {
    path: pathForRequest,
    siteId: channelId,
    locale,
  }
  if (client.isPreviewEnabled()) requestVars.changeset = client?.getChangeset()
  if (client.debug)
    console.log(
      `⚪ [CmsPage.loadContentByPath] Processed Next.JS route => getContentByPath Variables: ${JSON.stringify(requestVars)}`
    )

  const response = await getContentByPath(client, requestVars)
  if ((response?.content?.total ?? 0) === 0) {
    console.error(
      `🔴 [CmsPage.loadContentByPath] Unable to load content for ${requestPath}, empty resultset received`
    )
    return undefined
  }
  const info = Array.isArray(response?.content?.items)
    ? response?.content?.items[0]
    : response?.content?.items

  if (!info) {
    console.error(
      `🔴 [CmsPage.loadContentByPath] Unable to load content for ${requestPath}, data received: `,
      response
    )
    return undefined
  } else if ((response?.content?.total ?? 0) > 1) {
    console.warn(
      `🟠 [CmsPage.loadContentByPath] Resolving content for ${requestPath}, yielded ${response?.content?.total ?? 0} items, picked:`,
      info
    )
  }

  // Extract the type & link
  const contentType = Utils.normalizeContentType(info._metadata?.types)
  const contentLink = normalizeContentLinkWithLocale(info._metadata)
  if (!isContentLinkWithSetLocale(contentLink)) {
    console.error(
      '🔴 [CmsPage.loadContentByPath] Unable to infer the contentLink from the retrieved content, this should not have happened!'
    )
    return undefined
  }
  const graphLocale = localeToGraphLocale(contentLink.locale, ifChannelDefinition(channel))

  return [null, contentLink, contentType, graphLocale, info] as LookupResponse
}