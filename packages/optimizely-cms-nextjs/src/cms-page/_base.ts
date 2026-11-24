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
  Record<string, unknown> | null,
]

/**
 * The maximum length of the serialized variables that is added to the log output
 */
const MAX_LOGGED_VARIABLES_LENGTH = 2000

/**
 * Build the suffix for error output, so the failing request can be looked up
 * by Optimizely Support. Only call this when an error is being reported, it
 * serializes the variables.
 *
 * @param       client      The Optimizely Graph client that executed the request
 * @param       variables   The variables of the request, serialized (and capped to 2000 characters) when provided
 * @returns     A string starting with a space, which is empty if there is nothing to add
 */
export function getRequestDiagnostics(client: IOptiGraphClient | undefined, variables?: unknown): string {
  const requestId = typeof client?.getRequestId === 'function' ? client.getRequestId() : undefined
  let suffix = requestId ? ` [request-id: ${requestId}]` : ''
  if (variables !== undefined) {
    const serialized = JSON.stringify(variables) ?? ''
    suffix += ` [variables: ${serialized.length > MAX_LOGGED_VARIABLES_LENGTH ? serialized.substring(0, MAX_LOGGED_VARIABLES_LENGTH) + '…' : serialized}]`
  }
  return suffix
}

export function getChannelId(client: IOptiGraphClient, channel?: ChannelDefinition | string) {
  if (!channel)
    return undefined
  if (isString(channel))
    return channel
  return client.currentOptiCmsSchema == OptiCmsSchema.CMS12
    ? channel.id
    : channel.getPrimaryDomain().origin
}

function isString(toTest: unknown): toTest is string {
  return typeof toTest === 'string';
}
