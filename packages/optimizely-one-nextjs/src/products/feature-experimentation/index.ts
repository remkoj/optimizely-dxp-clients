/**
 * Feature Experimentation building blocks that work in both Server and Client
 * Components: the shared user/attributes model, the decision result type and
 * the paths of the datafile proxy. It intentionally has no runtime
 * dependencies, so it can be imported from any context.
 */
import type { Client, OptimizelyDecision, OptimizelyDecideOption, OptimizelySegmentOption, OptimizelyUserContext, UserAttributes } from '@optimizely/optimizely-sdk'

export type { UserAttributes, UserAttributeValue, OptimizelyDecision } from '@optimizely/optimizely-sdk'

/**
 * The attributes of a visitor that are used for audience targeting. Must be
 * plain (serializable) values, so they can be handed from Server to Client
 * Components.
 */
export type FeatureExperimentationAttributes = UserAttributes

/**
 * The visitor that decisions are made for. The same shape is used by the
 * server-side and client-side decision methods. The `id` is the value of the
 * visitor cookie (`OPTIMIZELY_FRONTEND_COOKIE`), which ensures both sides
 * make decisions for the same visitor.
 */
export type FeatureExperimentationUser = {
  /** Identifier of the visitor */
  id: string
  /** Attributes used for audience targeting */
  attributes?: FeatureExperimentationAttributes
  /**
   * The ODP real-time audiences (segments) the visitor qualifies for, when
   * already known, for example fetched with `getQualifiedSegments` on the
   * server. Decisions use these instead of fetching them from ODP. Must be
   * serializable.
   */
  qualifiedSegments?: string[]
  /**
   * The ODP visitor ID (the `vuid` cookie of the ODP tracker). When known, the
   * ODP real-time audiences are looked up with it, which works for every ODP
   * account. Without it the lookup uses the `id` as `fs_user_id`, which ODP
   * only accepts when `fs_user_id` is configured as a customer identifier.
   * Read from the `vuid` cookie when not set in the browser.
   */
  vuid?: string
}

/**
 * How to treat the segment cache when fetching the ODP real-time audiences of
 * a visitor: `IGNORE_CACHE` skips the cache for this lookup, `RESET_CACHE`
 * clears the whole segment cache.
 */
export type FeatureExperimentationSegmentOption = 'IGNORE_CACHE' | 'RESET_CACHE'

/**
 * Function that determines the attributes of a visitor. It can be a client
 * function, or a Server Function (`'use server'`) that uses `cookies()` and
 * `headers()` to calculate attributes on the server. The attributes it returns
 * must be serializable.
 *
 * @param user  The visitor as known in the browser, including the attributes so far
 * @returns     The attributes to merge into the attributes of the visitor
 */
export type FeatureExperimentationAttributesResolver = (user: FeatureExperimentationUser) => FeatureExperimentationAttributes | Promise<FeatureExperimentationAttributes>

/**
 * A feature flag decision, without the SDK's user context. This is a plain
 * object, so it can be passed from Server to Client Components.
 */
export type FeatureExperimentationDecision = Omit<OptimizelyDecision, 'userContext'>

/**
 * Options of the decision methods. The same shape is used on the server and the
 * client.
 */
export type FeatureExperimentationDecideOptions = {
  /**
   * The visitor to make the decision for. Required on the server; on the
   * client it defaults to the visitor of the `<OptimizelyOne />` provider.
   */
  user?: FeatureExperimentationUser
  /** `OptimizelyDecideOption` values that influence the decision */
  options?: OptimizelyDecideOption[]
  /**
   * Don't fetch the ODP real-time audiences of the visitor for this decision.
   * Audiences that depend on them then don't match, unless the user has
   * `qualifiedSegments`.
   */
  skipSegments?: boolean
  /** Segment cache handling when the ODP real-time audiences are fetched */
  segmentOptions?: FeatureExperimentationSegmentOption[]
}

/**
 * Base path of the datafile proxy endpoints, used when no other path is
 * configured.
 */
export const DEFAULT_PROXY_PATH = '/api/fx'

/**
 * Cache tag of the Feature Experimentation datafile. Purge it to force the
 * datafile to be retrieved again.
 */
export const DATAFILE_TAG = 'optimizely-fx-datafile'

/**
 * Create a visitor.
 *
 * @param id          The identifier of the visitor
 * @param attributes  The attributes of the visitor
 * @param qualifiedSegments  The ODP real-time audiences of the visitor, when already known
 * @param vuid        The ODP visitor ID of the visitor, when known
 * @returns           The visitor
 */
export function createUser(id: string, attributes?: FeatureExperimentationAttributes, qualifiedSegments?: string[], vuid?: string): FeatureExperimentationUser {
  const user: FeatureExperimentationUser = { id }
  if (vuid)
    user.vuid = vuid
  if (attributes && Object.keys(attributes).length > 0)
    user.attributes = attributes
  if (qualifiedSegments)
    user.qualifiedSegments = qualifiedSegments
  return user
}

/**
 * Merge attribute sets, later sets take precedence. Attributes with an
 * `undefined` value are left out.
 *
 * @param sources   The attribute sets to merge
 * @returns         The merged attributes
 */
export function mergeAttributes(...sources: Array<FeatureExperimentationAttributes | undefined | null>): FeatureExperimentationAttributes {
  const merged: FeatureExperimentationAttributes = {}
  for (const source of sources)
    for (const [key, value] of Object.entries(source ?? {}))
      if (value !== undefined)
        merged[key] = value
  return merged
}

/**
 * Get the ODP visitor ID from the value of the `vuid` cookie of the ODP tracker
 * (`<uuid>|<timestamp>`).
 *
 * @param cookieValue   The value of the `vuid` cookie
 * @returns             The ODP visitor ID, `undefined` when there is none
 */
export function parseVuid(cookieValue?: string | null): string | undefined {
  return cookieValue?.split('|')[0]?.replaceAll('-', '') || undefined
}

/**
 * Read the ODP visitor ID from the `vuid` cookie of the ODP tracker in the browser.
 *
 * @returns The ODP visitor ID, `undefined` on the server or when the tracker hasn't set the cookie (yet)
 */
export function readVuidCookie(): string | undefined {
  if (typeof document === 'undefined')
    return undefined
  const match = /(?:^|;\s*)vuid=([^;]*)/.exec(document.cookie)
  return match ? parseVuid(decodeURIComponent(match[1])) : undefined
}

type OdpConfig = { host: string, publicKey: string, segments: string[] }

const odpConfigs = new Map<string, OdpConfig | null>()

function collectSegments(node: unknown, segments: Set<string>): void {
  if (Array.isArray(node))
    node.forEach(item => collectSegments(item, segments))
  else if (node && typeof node === 'object') {
    const condition = node as Record<string, unknown>
    if (condition.type === 'third_party_dimension' && condition.name === 'odp.audiences' && typeof condition.value === 'string')
      segments.add(condition.value)
  }
}

function getOdpConfig(client: Client): OdpConfig | undefined {
  const config = client.getOptimizelyConfig()
  if (!config)
    return undefined
  const cacheKey = `${config.sdkKey}|${config.revision}`
  if (!odpConfigs.has(cacheKey)) {
    let odpConfig: OdpConfig | null = null
    try {
      const datafile = JSON.parse(config.getDatafile())
      const integration = (datafile.integrations ?? []).find((item: { key?: string }) => item.key === 'odp')
      if (integration?.host && integration?.publicKey) {
        const segments = new Set<string>()
        for (const audience of [...(datafile.audiences ?? []), ...(datafile.typedAudiences ?? [])]) {
          const conditions = typeof audience.conditions === 'string' ? JSON.parse(audience.conditions) : audience.conditions
          collectSegments(conditions, segments)
        }
        odpConfig = { host: integration.host, publicKey: integration.publicKey, segments: [...segments] }
      }
    } catch {
      odpConfig = null
    }
    odpConfigs.set(cacheKey, odpConfig)
  }
  return odpConfigs.get(cacheKey) ?? undefined
}

const SEGMENT_CACHE_TTL = 30_000
const SEGMENT_CACHE_MAX = 1000
const SEGMENT_REQUEST_TIMEOUT = 3_000
const vuidSegments = new Map<string, { expires: number, segments: string[] }>()

/**
 * Look up the ODP real-time audiences with the ODP visitor ID. The SDK can only
 * look them up with the `fs_user_id`, which ODP rejects when that isn't set up as
 * customer identifier; the visitor ID is always accepted. Results are cached for
 * 30 seconds per visitor.
 */
async function fetchSegmentsByVuid(client: Client, vuid: string, segmentOptions?: FeatureExperimentationSegmentOption[]): Promise<string[] | undefined> {
  const odp = getOdpConfig(client)
  if (!odp || odp.segments.length === 0)
    return odp ? [] : undefined
  if (segmentOptions?.includes('RESET_CACHE'))
    vuidSegments.clear()
  const cacheKey = `${odp.publicKey}|${vuid}`
  const cached = vuidSegments.get(cacheKey)
  if (cached && cached.expires > Date.now() && !segmentOptions?.includes('IGNORE_CACHE'))
    return cached.segments
  const query = `query {customer(vuid: ${JSON.stringify(vuid)}) {audiences(subset: ${JSON.stringify(odp.segments)}) {edges {node {name state}}}}}`
  const response = await fetch(`${odp.host.replace(/\/+$/, '')}/v3/graphql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': odp.publicKey },
    body: JSON.stringify({ query }),
    cache: 'no-store',
    signal: AbortSignal.timeout(SEGMENT_REQUEST_TIMEOUT)
  })
  if (!response.ok)
    throw new Error(`ODP responded with status ${response.status}`)
  const body = await response.json() as { errors?: unknown[], data?: { customer?: { audiences?: { edges?: Array<{ node: { name: string, state: string } }> } } } }
  const edges = body.data?.customer?.audiences?.edges
  if (body.errors?.length || !edges)
    throw new Error(`ODP did not return the audiences: ${JSON.stringify(body.errors ?? body)}`)
  const segments = edges.filter(edge => edge.node.state === 'qualified').map(edge => edge.node.name)
  if (vuidSegments.size >= SEGMENT_CACHE_MAX)
    vuidSegments.clear()
  vuidSegments.set(cacheKey, { expires: Date.now() + SEGMENT_CACHE_TTL, segments })
  return segments
}

/**
 * Create the SDK user context of a visitor and make it ready for decisions,
 * including the ODP real-time audiences. These are taken from the visitor when
 * known, otherwise fetched from ODP when the project has the integration
 * enabled: with the ODP visitor ID (`vuid`) of the visitor when available (in the
 * browser read from the `vuid` cookie), otherwise by the SDK using the visitor `id`
 * as `fs_user_id`. When ODP is not available audience conditions that depend on it
 * don't match; the decision is still made.
 *
 * @param client    The SDK client, ready for use
 * @param user      The visitor
 * @param options   Segment handling: `skipSegments` and `segmentOptions`
 * @returns         The user context
 */
export async function createUserContext(client: Client, user: FeatureExperimentationUser, { skipSegments, segmentOptions }: Pick<FeatureExperimentationDecideOptions, 'skipSegments' | 'segmentOptions'> = {}): Promise<OptimizelyUserContext> {
  const context = client.createUserContext(user.id, user.attributes)
  if (!context)
    throw new Error('Unable to create the Feature Experimentation user context')
  if (user.qualifiedSegments)
    context.qualifiedSegments = user.qualifiedSegments
  else if (!skipSegments && client.isOdpIntegrated())
    try {
      const vuid = user.vuid ?? readVuidCookie()
      const segments = vuid ? await fetchSegmentsByVuid(client, vuid, segmentOptions) : undefined
      if (segments)
        context.qualifiedSegments = segments
      else
        await context.fetchQualifiedSegments(segmentOptions as unknown as OptimizelySegmentOption[] | undefined)
    } catch (error) {
      console.error('🔴 [FeatureExperimentation] Unable to fetch the real-time audiences from ODP', error)
    }
  return context
}

/**
 * Get the ODP real-time audiences (segments) a visitor qualifies for.
 *
 * @param client    The SDK client, ready for use
 * @param user      The visitor
 * @param segmentOptions  Segment cache handling
 * @returns         The segments, empty when ODP is not enabled for the project or not available
 */
export async function fetchQualifiedSegments(client: Client, user: FeatureExperimentationUser, segmentOptions?: FeatureExperimentationSegmentOption[]): Promise<string[]> {
  if (user.qualifiedSegments)
    return user.qualifiedSegments
  const context = await createUserContext(client, user, { segmentOptions })
  return context.qualifiedSegments ?? []
}

/**
 * Convert an SDK decision into a plain decision.
 *
 * @param decision  The decision as returned by the SDK
 * @returns         The decision without the user context
 */
export function toDecision(decision: OptimizelyDecision): FeatureExperimentationDecision {
  return {
    flagKey: decision.flagKey,
    enabled: decision.enabled,
    variationKey: decision.variationKey,
    ruleKey: decision.ruleKey,
    variables: decision.variables,
    reasons: decision.reasons
  }
}

function normalizePath(path: string): string {
  const trimmed = path.replace(/\/+$/, '')
  return trimmed.startsWith('/') ? trimmed : '/' + trimmed
}

/**
 * Get the path of the datafile endpoint of the proxy.
 *
 * @param proxyPath   The base path of the proxy, defaults to {@link DEFAULT_PROXY_PATH}
 * @returns           The path the browser reads the datafile from
 */
export function getDatafilePath(proxyPath: string = DEFAULT_PROXY_PATH): string {
  return normalizePath(proxyPath) + '/datafile'
}

/**
 * Get the path of the webhook endpoint of the proxy.
 *
 * @param proxyPath   The base path of the proxy, defaults to {@link DEFAULT_PROXY_PATH}
 * @returns           The path to configure at Feature Experimentation as webhook
 */
export function getWebhookPath(proxyPath: string = DEFAULT_PROXY_PATH): string {
  return normalizePath(proxyPath) + '/webhook'
}
