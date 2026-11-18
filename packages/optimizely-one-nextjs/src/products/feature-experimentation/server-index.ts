import 'server-only'
import { cookies } from 'next/headers'
import { revalidateTag } from 'next/cache'
import { createHmac, timingSafeEqual } from 'node:crypto'
import {
  createInstance,
  createPollingProjectConfigManager,
  createStaticProjectConfigManager,
  createForwardingEventProcessor,
  createOdpManager,
  type Client,
  type OptimizelyUserContext
} from '@optimizely/optimizely-sdk'
import getConfig, { checkProductStatus } from '../../config.js'
import * as Session from '../../utils/session.js'
import type { VisitorCookieSource } from '../../utils/session.js'
import type { NextRequest } from 'next/server'
import {
  DATAFILE_TAG,
  createUser,
  createUserContext as createSdkUserContext,
  fetchQualifiedSegments,
  toDecision,
  type FeatureExperimentationAttributes,
  type FeatureExperimentationDecideOptions,
  type FeatureExperimentationDecision,
  type FeatureExperimentationSegmentOption,
  type FeatureExperimentationUser
} from './index.js'

export * from './index.js'


const DATAFILE_EVENT = 'project.datafile_updated'
const READY_TIMEOUT = 10_000
const POLLING_INTERVAL = 1000 * 60 * 5

/**
 * Get the URL of the datafile on the Optimizely CDN.
 *
 * @param sdkKey  The SDK key of the Feature Experimentation environment
 * @returns       The CDN URL of the datafile
 */
export function getDatafileCdnUrl(sdkKey: string): string {
  return `https://cdn.optimizely.com/datafiles/${encodeURIComponent(sdkKey)}.json`
}

/**
 * Retrieve the datafile of the configured SDK key (`OPTIMIZELY_FX_SDKKEY`).
 *
 * When the proxy is enabled (`OPTIMIZELY_FX_PROXY`) the datafile is stored in
 * the Next.js data cache, tagged with {@link DATAFILE_TAG}. It is only
 * retrieved again when there is no cached copy yet, which is the case during
 * the build and after {@link purgeDatafile} (the datafile webhook) was called.
 * Without the proxy, the datafile is always retrieved from the CDN.
 *
 * @param sdkKey  The SDK key, defaults to the configured SDK key
 * @returns       The datafile as JSON string
 * @throws        When no SDK key is available, or the datafile cannot be retrieved
 */
export async function getDatafile(sdkKey: string | undefined = getConfig().FeatureExperimentationSdkKey): Promise<string> {
  if (!sdkKey)
    throw new Error('Feature Experimentation is not configured, set OPTIMIZELY_FX_SDKKEY')
  const config = getConfig()
  const init: RequestInit & { next?: { tags: string[] } } = config.FeatureExperimentationProxy ?
    { cache: 'force-cache', next: { tags: [DATAFILE_TAG] } } :
    { cache: 'no-store' }
  const response = await fetch(getDatafileCdnUrl(sdkKey), init)
  if (!response.ok)
    throw new Error(`Unable to retrieve the Feature Experimentation datafile: ${response.status} ${response.statusText}`)
  const datafile = await response.text()
  if (config.OptimizelyDebug)
    console.log('🔧 [FeatureExperimentation] Datafile retrieved, revision', readRevision(datafile))
  return datafile
}

/**
 * Purge the cached datafile, so it will be retrieved again on next use.
 * This is what the datafile webhook does.
 */
export function purgeDatafile(): void {
  revalidateTag(DATAFILE_TAG, { expire: 0 })
}

function readRevision(datafile: string): string {
  try {
    return String(JSON.parse(datafile).revision ?? '')
  } catch {
    return ''
  }
}

let staticClient: { key: string, client: Client } | undefined
const pollingClients = new Map<string, Client>()

/**
 * Whether ODP (Optimizely Data Platform) is configured in this package
 * (`OPTIMIZELY_DATAPLATFORM_ID`). Only then are ODP real-time audiences used.
 */
function isOdpConfigured(): boolean {
  return checkProductStatus(getConfig()).dataPlatform
}

/**
 * Get the shared SDK client. With the proxy enabled, the client is built from
 * the cached datafile and replaced when the datafile revision changes (after
 * a webhook purge). Without the proxy, the client polls the CDN for updates.
 */
async function getClient(): Promise<Client> {
  const config = getConfig()
  const sdkKey = config.FeatureExperimentationSdkKey
  if (!sdkKey)
    throw new Error('Feature Experimentation is not configured, set OPTIMIZELY_FX_SDKKEY')

  if (config.FeatureExperimentationProxy) {
    const datafile = await getDatafile(sdkKey)
    const key = `${sdkKey}@${readRevision(datafile)}`
    if (staticClient?.key !== key) {
      const client = createInstance({
        projectConfigManager: createStaticProjectConfigManager({ datafile }),
        eventProcessor: createForwardingEventProcessor(),
        ...(isOdpConfigured() ? { odpManager: createOdpManager() } : {})
      })
      if (!client)
        throw new Error('Unable to create the Feature Experimentation client')
      staticClient = { key, client }
    }
    await staticClient.client.onReady({ timeout: READY_TIMEOUT })
    return staticClient.client
  }

  let client = pollingClients.get(sdkKey)
  if (!client) {
    client = createInstance({
      projectConfigManager: createPollingProjectConfigManager({ sdkKey, autoUpdate: true, updateInterval: POLLING_INTERVAL }),
      eventProcessor: createForwardingEventProcessor(),
      ...(isOdpConfigured() ? { odpManager: createOdpManager() } : {})
    })
    if (!client)
      throw new Error('Unable to create the Feature Experimentation client')
    pollingClients.set(sdkKey, client)
  }
  await client.onReady({ timeout: READY_TIMEOUT })
  return client
}

async function createUserContext(user: FeatureExperimentationUser | undefined, options?: Pick<FeatureExperimentationDecideOptions, 'skipSegments' | 'segmentOptions'>): Promise<OptimizelyUserContext> {
  if (!user?.id)
    throw new Error('A user is required for server-side Feature Experimentation decisions, see getUser()')
  return createSdkUserContext(await getClient(), user, { ...options, skipSegments: options?.skipSegments || !isOdpConfigured() })
}

/**
 * Get the ODP real-time audiences (segments) a visitor qualifies for. Pass the
 * result as `qualifiedSegments` of the visitor to hand it to Client Components,
 * so the browser doesn't have to fetch it again, and to make decisions with it.
 *
 * @param user            The visitor, from {@link getUser}
 * @param segmentOptions  Segment cache handling
 * @returns               The segments, empty when ODP is not configured in this package
 *                        (`OPTIMIZELY_DATAPLATFORM_ID`), not enabled for the project or not available
 */
export async function getQualifiedSegments(user: FeatureExperimentationUser, segmentOptions?: FeatureExperimentationSegmentOption[]): Promise<string[]> {
  if (!user?.id)
    throw new Error('A user is required to get the real-time audiences, see getUser()')
  if (!isOdpConfigured())
    return user.qualifiedSegments ?? []
  return fetchQualifiedSegments(await getClient(), user, segmentOptions)
}

/**
 * Get the current visitor, using the visitor cookie (`OPTIMIZELY_FRONTEND_COOKIE`)
 * that the browser-side provider uses as well. The cookie is written by
 * `withOptimizelyOne`, which also makes it visible to the rest of the request, so the
 * visitor is known on the very first request of a new visitor.
 *
 * In a proxy, `cookies()` is not available: pass the `request` instead. Only within the
 * proxy that `withOptimizelyOne` wraps, the request already contains the visitor cookie of
 * a new visitor. Use {@link getOrCreateUser} when that can't be guaranteed.
 *
 * @param attributes    The attributes of the visitor
 * @param source        Where to read the visitor cookie from: the cookie store, or the request (`NextRequest` in a proxy). Defaults to the cookies of the current request (`cookies()`), which is not available in a proxy.
 * @returns             The visitor, or `undefined` when there is no visitor cookie
 */
export async function getUser(attributes?: FeatureExperimentationAttributes, source?: VisitorCookieSource): Promise<FeatureExperimentationUser | undefined> {
  const store = source ?? await cookies()
  const id = Session.getVisitorId(store)
  return id ? createUser(id, attributes, undefined, Session.getOdpVisitorId(store)) : undefined
}

/**
 * Get the visitor in a proxy, also when the request has no visitor cookie yet. A
 * new visitor gets an ID that is remembered for the request, which is the ID that
 * `withOptimizelyOne` writes to the cookie, no matter whether this runs inside or
 * outside of the proxy that `withOptimizelyOne` wraps.
 *
 * @param request       The request of the proxy
 * @param attributes    The attributes of the visitor
 * @returns             The visitor, never `undefined`
 */
export function getOrCreateUser(request: NextRequest, attributes?: FeatureExperimentationAttributes): FeatureExperimentationUser {
  return createUser(Session.getOrCreateVisitorId(request), attributes, undefined, Session.getOdpVisitorId(request))
}

/**
 * Make a decision for a single feature flag.
 *
 * @param flagKey   The key of the feature flag
 * @param options   The visitor (required), decide options and segment handling (`skipSegments`, `segmentOptions`)
 * @returns         The decision
 */
export async function decide(flagKey: string, { user, options, skipSegments, segmentOptions }: FeatureExperimentationDecideOptions = {}): Promise<FeatureExperimentationDecision> {
  return toDecision((await createUserContext(user, { skipSegments, segmentOptions })).decide(flagKey, options))
}

/**
 * Make decisions for a set of feature flags.
 *
 * @param flagKeys  The keys of the feature flags
 * @param options   The visitor (required), decide options and segment handling (`skipSegments`, `segmentOptions`)
 * @returns         The decisions, by flag key
 */
export async function decideForKeys(flagKeys: string[], { user, options, skipSegments, segmentOptions }: FeatureExperimentationDecideOptions = {}): Promise<Record<string, FeatureExperimentationDecision>> {
  const decisions = (await createUserContext(user, { skipSegments, segmentOptions })).decideForKeys(flagKeys, options)
  return Object.fromEntries(Object.entries(decisions).map(([key, decision]) => [key, toDecision(decision)]))
}

/**
 * Make decisions for all feature flags.
 *
 * @param options   The visitor (required), decide options and segment handling (`skipSegments`, `segmentOptions`)
 * @returns         The decisions, by flag key
 */
export async function decideAll({ user, options, skipSegments, segmentOptions }: FeatureExperimentationDecideOptions = {}): Promise<Record<string, FeatureExperimentationDecision>> {
  const decisions = (await createUserContext(user, { skipSegments, segmentOptions })).decideAll(options)
  return Object.fromEntries(Object.entries(decisions).map(([key, decision]) => [key, toDecision(decision)]))
}

function json(body: unknown, status: number, cacheControl: string = 'no-store'): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': cacheControl } })
}

/**
 * Create the route handler that serves the datafile to the browser. Export it as
 * `GET` of a route (by default `/api/fx/datafile`) that is statically rendered
 * (`export const dynamic = 'force-static'`), so the datafile is retrieved and
 * cached during the build. It responds with 404 unless `OPTIMIZELY_FX_PROXY` is enabled.
 *
 * @returns   The `GET` route handler
 */
export function createDatafileHandler(): () => Promise<Response> {
  return async function GET() {
    const config = getConfig()
    if (!config.FeatureExperimentationProxy || !config.FeatureExperimentationSdkKey)
      return json({ error: { status: 404, message: 'Not found' } }, 404)
    try {
      return new Response(await getDatafile(config.FeatureExperimentationSdkKey), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
        }
      })
    } catch (error) {
      console.error('🔴 [FeatureExperimentation] Datafile proxy failed', error)
      return json({ error: { status: 502, message: 'Unable to retrieve the datafile' } }, 502)
    }
  }
}

function isValidSignature(secret: string, body: string, signature: string | null): boolean {
  if (!signature)
    return false
  const expected = Buffer.from('sha1=' + createHmac('sha1', secret).update(body).digest('hex'), 'utf-8')
  const received = Buffer.from(signature, 'utf-8')
  return expected.length === received.length && timingSafeEqual(expected, received)
}

/**
 * Create the route handler that receives the `project.datafile_updated` webhook of
 * Feature Experimentation and purges the cached datafile. Export it as `POST` of a
 * route (by default `/api/fx/webhook`) and configure the URL of that route as a webhook
 * at Feature Experimentation. It responds with 404 unless `OPTIMIZELY_FX_PROXY` is enabled.
 *
 * When `OPTIMIZELY_FX_WEBHOOK_SECRET` is set, the `X-Hub-Signature` of the request
 * must match; requests that do not are rejected with 401. Other events, and
 * datafiles of other SDK keys, are ignored.
 *
 * @returns   The `POST` route handler
 */
export function createWebhookHandler(): (request: Request) => Promise<Response> {
  return async function POST(request) {
    const config = getConfig()
    if (!config.FeatureExperimentationProxy || !config.FeatureExperimentationSdkKey)
      return json({ error: { status: 404, message: 'Not found' } }, 404)

    const body = await request.text()
    const secret = config.FeatureExperimentationWebhookSecret
    if (secret && !isValidSignature(secret, body, request.headers.get('X-Hub-Signature')))
      return json({ error: { status: 401, message: 'Invalid signature' } }, 401)

    let payload: { event?: unknown, data?: { cdn_url?: unknown } }
    try {
      payload = JSON.parse(body)
    } catch {
      return json({ error: { status: 400, message: 'Invalid payload' } }, 400)
    }

    const cdnUrl = payload?.data?.cdn_url
    const otherKey = typeof cdnUrl === 'string' && !cdnUrl.includes(config.FeatureExperimentationSdkKey)
    if (payload?.event !== DATAFILE_EVENT || otherKey)
      return json({ purged: false }, 200)

    purgeDatafile()
    if (config.OptimizelyDebug)
      console.log('🔧 [FeatureExperimentation] Datafile purged by webhook')
    return json({ purged: true }, 200)
  }
}
