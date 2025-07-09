import { OptiCmsSchema, type IOptiGraphClient } from '@remkoj/optimizely-graph-client/client'
import { type ChannelDefinition } from "@remkoj/optimizely-graph-client/channels"
import { type Route } from "@remkoj/optimizely-graph-client/router"
import { type ContentLinkWithLocale } from "@remkoj/optimizely-graph-client"

export enum SystemLocales {
  All = 'ALL',
  Neutral = 'NEUTRAL',
}

export type LookupResponse = [
  Route | null,
  ContentLinkWithLocale,
  string[],
  string,
  Record<string, any> | null,
]

export function getChannelId(client: IOptiGraphClient, channel?: ChannelDefinition | string) {
  if (!channel)
    return undefined
  if (isString(channel))
    return channel
  return client.currentOptiCmsSchema == OptiCmsSchema.CMS12
    ? channel.id
    : getPrimaryURL(channel).origin
}

function getPrimaryURL(chnl: ChannelDefinition): URL {
  const dd = chnl.domains.filter((x) => x.isPrimary).at(0) ?? chnl.domains.at(0)
  if (!dd) return chnl.getPrimaryDomain()
  const s =
    dd.name.startsWith('localhost') || dd.name.indexOf('.local') > 0
      ? 'http:'
      : 'https:'
  return new URL(`${s}//${dd.name}`)
}

function isString(toTest: any): toTest is string {
  return typeof toTest === 'string';
}