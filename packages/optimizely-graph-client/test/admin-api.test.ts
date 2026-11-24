import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import createAdminApi, { createClient, isApiError, type OptimizelyGraphAdminApi } from '../src/admin-api/index.js'

type Recorded = {
  method: string
  path: string
  query: Record<string, string[]>
  body: string
  contentType: string | null
  authorization: string | null
  xClient: string | null
}

const CONFIG = {
  single_key: 'single-key',
  gateway: 'https://graph.example.com',
  app_key: 'app-key',
  secret: Buffer.from('graph-secret').toString('base64')
}

let requests: Recorded[]
let respond: (request: Request) => Response

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })
}

beforeEach(() => {
  requests = []
  respond = () => jsonResponse({})
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init)
    const url = new URL(request.url)
    const query: Record<string, string[]> = {}
    url.searchParams.forEach((value, key) => { (query[key] ??= []).push(value) })
    requests.push({
      method: request.method,
      path: url.pathname,
      query,
      body: await request.clone().text(),
      contentType: request.headers.get('content-type'),
      authorization: request.headers.get('authorization'),
      xClient: request.headers.get('x-client')
    })
    return respond(request)
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createClient', () => {
  it('is the default export as well', () => {
    expect(createAdminApi).toBe(createClient)
  })

  it('sends unsigned requests when no App Key and Secret are configured', async () => {
    await createClient({ single_key: 'single-key', gateway: 'https://graph.example.com' }).webhooks.listWebhookHandler()
    expect(requests[0].authorization).toBeNull()
  })
})

describe('request signing', () => {
  it('signs every request with an epi-hmac Authorization header and identifies the client', async () => {
    await createClient(CONFIG).webhooks.listWebhookHandler()
    expect(requests).toHaveLength(1)
    expect(requests[0].authorization).toMatch(/^epi-hmac app-key:\d+:[^:]+:[A-Za-z0-9+/=]+$/)
    expect(requests[0].xClient).toBe('@RemkoJ/OptimizelyGraphClient')
  })

  it('signs the body that is actually sent', async () => {
    const payload = { request: { url: 'https://site.example.com/publish', method: 'POST' } }
    await createClient(CONFIG).webhooks.createWebhookHandler(payload)
    expect(requests[0].body).toBe(JSON.stringify(payload))
    expect(requests[0].authorization).toMatch(/^epi-hmac app-key:/)
  })

  it('does not write to the console', async () => {
    const spies = [vi.spyOn(console, 'log'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'error')]
    await createClient(CONFIG).webhooks.createWebhookHandler({ request: { url: 'https://site.example.com/publish' } })
    spies.forEach(spy => expect(spy).not.toHaveBeenCalled())
    vi.restoreAllMocks()
  })
})

type Case = {
  name: string
  call: (api: OptimizelyGraphAdminApi) => Promise<unknown>
  expected: {
    method: string
    path: string
    query?: Record<string, string[]>
    body?: string
    contentType?: string
  }
}

const json = (value: unknown) => JSON.stringify(value)
const cases: Case[] = [
  // Best bets
  { name: 'bestBets.getBestBetCollectionHandler', call: api => api.bestBets.getBestBetCollectionHandler('a', 2), expected: { method: 'GET', path: '/api/bestbets/collection', query: { id: ['a'], page: ['2'] } } },
  { name: 'bestBets.createBestBetCollectionHandler', call: api => api.bestBets.createBestBetCollectionHandler({ name: 'n' } as never), expected: { method: 'POST', path: '/api/bestbets/collection', body: json({ name: 'n' }), contentType: 'application/json' } },
  { name: 'bestBets.updateBestBetCollectionHandler', call: api => api.bestBets.updateBestBetCollectionHandler('id1', { name: 'n' } as never), expected: { method: 'PUT', path: '/api/bestbets/collection/id1', body: json({ name: 'n' }), contentType: 'application/json' } },
  { name: 'bestBets.deleteBestBetCollectionHandler', call: api => api.bestBets.deleteBestBetCollectionHandler('id1'), expected: { method: 'DELETE', path: '/api/bestbets/collection/id1' } },
  // Definition v2
  { name: 'definitionV2.postContentV2DataHandler', call: api => api.definitionV2.postContentV2DataHandler('src', '{"a":1}\n'), expected: { method: 'POST', path: '/api/content/v2/data', query: { id: ['src'] }, body: JSON.stringify('{"a":1}\n') } },
  { name: 'definitionV2.deleteContentV2DataHandler', call: api => api.definitionV2.deleteContentV2DataHandler('src', ['en', 'nl']), expected: { method: 'DELETE', path: '/api/content/v2/data', query: { id: ['src'], languages: ['en', 'nl'] } } },
  { name: 'definitionV2.postContentV2TypeHandler', call: api => api.definitionV2.postContentV2TypeHandler({ id: 'x' } as never), expected: { method: 'POST', path: '/api/content/v2/types', body: json({ id: 'x' }), contentType: 'application/json' } },
  // Definition v3
  { name: 'definitionV3.getContentV3SourceHandler (all)', call: api => api.definitionV3.getContentV3SourceHandler(), expected: { method: 'GET', path: '/api/content/v3/sources' } },
  { name: 'definitionV3.getContentV3SourceHandler (one)', call: api => api.definitionV3.getContentV3SourceHandler('src', 'new' as never, '5'), expected: { method: 'GET', path: '/api/content/v3/sources', query: { id: ['src'], slot: ['new'], count: ['5'] } } },
  { name: 'definitionV3.deleteContentV3SourceHandler', call: api => api.definitionV3.deleteContentV3SourceHandler('src', 'data' as never, 'old' as never), expected: { method: 'DELETE', path: '/api/content/v3/sources', query: { id: ['src'], mode: ['data'], slot: ['old'] } } },
  { name: 'definitionV3.postContentV3SourceHandler', call: api => api.definitionV3.postContentV3SourceHandler('src', { label: 'l', description: 'd' }, 'new' as never), expected: { method: 'POST', path: '/api/content/v3/sources', query: { id: ['src'], slot: ['new'] }, body: json({ label: 'l', description: 'd' }), contentType: 'application/json' } },
  { name: 'definitionV3.getContentV3TypeHandler', call: api => api.definitionV3.getContentV3TypeHandler(), expected: { method: 'GET', path: '/api/content/v3/types', query: { id: ['default'] } } },
  { name: 'definitionV3.postContentV3TypeHandler', call: api => api.definitionV3.postContentV3TypeHandler({ a: 1 } as never, 'src'), expected: { method: 'POST', path: '/api/content/v3/types', query: { id: ['src'] }, body: json({ a: 1 }), contentType: 'application/json' } },
  { name: 'definitionV3.putContentV3TypeHandler', call: api => api.definitionV3.putContentV3TypeHandler({ a: 1 } as never), expected: { method: 'PUT', path: '/api/content/v3/types', query: { id: ['default'] }, body: json({ a: 1 }), contentType: 'application/json' } },
  // Logs
  { name: 'logs.getRequestLogHandler', call: api => api.logs.getRequestLogHandler(1, 'rid', 'host', '/p', true), expected: { method: 'GET', path: '/api/logs/request', query: { page: ['1'], requestId: ['rid'], host: ['host'], path: ['/p'], success: ['true'] } } },
  // OIDC
  { name: 'oidc.upsertOidcConfigHandler', call: api => api.oidc.upsertOidcConfigHandler({ iss: 'x' } as never), expected: { method: 'PUT', path: '/api/config/oidc', body: json({ iss: 'x' }), contentType: 'application/json' } },
  { name: 'oidc.deleteOidcConfigHandler', call: api => api.oidc.deleteOidcConfigHandler(), expected: { method: 'DELETE', path: '/api/config/oidc' } },
  // Pinned results
  { name: 'pinnedResults.listPinnedCollectionHandler', call: api => api.pinnedResults.listPinnedCollectionHandler(1, 'title'), expected: { method: 'GET', path: '/api/pinned/collections', query: { page: ['1'], sort: ['title'] } } },
  { name: 'pinnedResults.createPinnedCollectionHandler', call: api => api.pinnedResults.createPinnedCollectionHandler({ title: 't' } as never), expected: { method: 'POST', path: '/api/pinned/collections', body: json({ title: 't' }), contentType: 'application/json' } },
  { name: 'pinnedResults.getPinnedCollectionHandler', call: api => api.pinnedResults.getPinnedCollectionHandler('c1'), expected: { method: 'GET', path: '/api/pinned/collections/c1' } },
  { name: 'pinnedResults.updatePinnedCollectionHandler', call: api => api.pinnedResults.updatePinnedCollectionHandler('c1', { title: 't' } as never), expected: { method: 'PUT', path: '/api/pinned/collections/c1', body: json({ title: 't' }), contentType: 'application/json' } },
  { name: 'pinnedResults.deletePinnedCollectionHandler', call: api => api.pinnedResults.deletePinnedCollectionHandler('c1'), expected: { method: 'DELETE', path: '/api/pinned/collections/c1' } },
  { name: 'pinnedResults.listPinnedItemHandler', call: api => api.pinnedResults.listPinnedItemHandler('c1', 10, 5, 'ph', 'sort'), expected: { method: 'GET', path: '/api/pinned/collections/c1/items', query: { limit: ['10'], offset: ['5'], phrase: ['ph'], sort: ['sort'] } } },
  { name: 'pinnedResults.createPinnedItemHandler', call: api => api.pinnedResults.createPinnedItemHandler('c1', { phrase: 'p' } as never), expected: { method: 'POST', path: '/api/pinned/collections/c1/items', body: json({ phrase: 'p' }), contentType: 'application/json' } },
  { name: 'pinnedResults.clearPinnedItemHandler', call: api => api.pinnedResults.clearPinnedItemHandler('c1'), expected: { method: 'DELETE', path: '/api/pinned/collections/c1/items' } },
  { name: 'pinnedResults.getPinnedItemHandler', call: api => api.pinnedResults.getPinnedItemHandler('c1', 'i1'), expected: { method: 'GET', path: '/api/pinned/collections/c1/items/i1' } },
  { name: 'pinnedResults.updatePinnedItemHandler', call: api => api.pinnedResults.updatePinnedItemHandler('c1', 'i1', { phrase: 'p' } as never), expected: { method: 'PUT', path: '/api/pinned/collections/c1/items/i1', body: json({ phrase: 'p' }), contentType: 'application/json' } },
  { name: 'pinnedResults.deletePinnedItemHandler', call: api => api.pinnedResults.deletePinnedItemHandler('c1', 'i1'), expected: { method: 'DELETE', path: '/api/pinned/collections/c1/items/i1' } },
  { name: 'pinnedResults.matchPinnedItemHandler', call: api => api.pinnedResults.matchPinnedItemHandler({ phrase: 'p' } as never), expected: { method: 'POST', path: '/api/pinned/results', body: json({ phrase: 'p' }), contentType: 'application/json' } },
  // Query
  { name: 'queryGraphQl.getGraphQlv2Handler', call: api => api.queryGraphQl.getGraphQlv2Handler('{a}', undefined, 'op', '{}', 's', 'l'), expected: { method: 'GET', path: '/content/v2', query: { query: ['{a}'], operationName: ['op'], variables: ['{}'], sources: ['s'], lite: ['l'] } } },
  { name: 'queryGraphQl.postGraphQlv2Handler', call: api => api.queryGraphQl.postGraphQlv2Handler('s', 'l', { query: '{a}' } as never), expected: { method: 'POST', path: '/content/v2', query: { sources: ['s'], lite: ['l'] }, body: json({ query: '{a}' }), contentType: 'application/json' } },
  // Resources
  { name: 'resources.upsertStopwordHandler', call: api => api.resources.upsertStopwordHandler({ stopwords: ['a'] } as never, 'en', 'src'), expected: { method: 'PUT', path: '/resources/stopwords', query: { language_routing: ['en'], source_routing: ['src'] }, body: json({ stopwords: ['a'] }), contentType: 'text/plain' } },
  { name: 'resources.deleteStopwordHandler', call: api => api.resources.deleteStopwordHandler('en'), expected: { method: 'DELETE', path: '/resources/stopwords', query: { language_routing: ['en'] } } },
  { name: 'resources.listSynonymHandler', call: api => api.resources.listSynonymHandler('en', 'src', 'two'), expected: { method: 'GET', path: '/resources/synonyms', query: { language_routing: ['en'], source_routing: ['src'], synonym_slot: ['two'] } } },
  { name: 'resources.listSynonymHandler (default slot)', call: api => api.resources.listSynonymHandler(), expected: { method: 'GET', path: '/resources/synonyms', query: { synonym_slot: ['one'] } } },
  { name: 'resources.upsertSynonymHandler', call: api => api.resources.upsertSynonymHandler({ synonyms: ['a'] } as never), expected: { method: 'PUT', path: '/resources/synonyms', query: { synonym_slot: ['one'] }, body: json({ synonyms: ['a'] }), contentType: 'text/plain' } },
  { name: 'resources.deleteSynonymHandler', call: api => api.resources.deleteSynonymHandler('en', 'src'), expected: { method: 'DELETE', path: '/resources/synonyms', query: { language_routing: ['en'], source_routing: ['src'] } } },
  // Webhooks
  { name: 'webhooks.listWebhookHandler', call: api => api.webhooks.listWebhookHandler(), expected: { method: 'GET', path: '/api/webhooks' } },
  { name: 'webhooks.createWebhookHandler', call: api => api.webhooks.createWebhookHandler({ request: { url: 'https://a/b', method: 'POST', headers: { 'X-Test': 'v' } } }), expected: { method: 'POST', path: '/api/webhooks', body: json({ request: { url: 'https://a/b', method: 'POST', headers: { 'X-Test': 'v' } } }), contentType: 'application/json' } },
  { name: 'webhooks.deleteWebhookHandler', call: api => api.webhooks.deleteWebhookHandler('w/1'), expected: { method: 'DELETE', path: '/api/webhooks/w%2F1' } },
  { name: 'webhooks.updateWebhookHandler', call: api => api.webhooks.updateWebhookHandler('w1', { request: { url: 'https://a/b' } }), expected: { method: 'PUT', path: '/api/webhooks/w1', body: json({ request: { url: 'https://a/b' } }), contentType: 'application/json' } },
  // Extras
  { name: 'getJournal', call: api => api.getJournal('stream/abc'), expected: { method: 'GET', path: '/journal/stream/abc' } },
  { name: 'postSourceContent', call: api => api.postSourceContent('src', '{"a":1}\n{"b":2}\n'), expected: { method: 'POST', path: '/api/content/v2/data', query: { id: ['src'] }, body: '{"a":1}\n{"b":2}\n', contentType: 'application/x-ndjson' } },
  { name: 'getOpenApiSpec', call: api => api.getOpenApiSpec(), expected: { method: 'GET', path: '/app/swagger/swagger.json' } }
]

describe('request contract', () => {
  it.each(cases)('$name', async ({ call, expected }) => {
    await call(createClient(CONFIG))
    expect(requests).toHaveLength(1)
    const [actual] = requests
    expect(actual.method).toBe(expected.method)
    expect(actual.path).toBe(expected.path)
    expect(actual.query).toEqual(expected.query ?? {})
    expect(actual.body).toBe(expected.body ?? '')
    if (expected.contentType)
      expect(actual.contentType).toContain(expected.contentType)
  })
})

describe('responses', () => {
  it('returns the JSON body of a successful response', async () => {
    const hooks = [{ id: 'w1', request: { url: 'https://a/b', method: 'POST' } }]
    respond = () => jsonResponse(hooks)
    await expect(createClient(CONFIG).webhooks.listWebhookHandler()).resolves.toEqual(hooks)
  })

  it('returns the source map', async () => {
    respond = () => jsonResponse({ default: { id: 'default', label: 'l', languages: ['en'] } })
    await expect(createClient(CONFIG).definitionV3.getContentV3SourceHandler()).resolves.toEqual({
      default: { id: 'default', label: 'l', languages: ['en'] }
    })
  })

  it('resolves to nothing for an empty response', async () => {
    respond = () => new Response(null, { status: 204 })
    expect(await createClient(CONFIG).webhooks.deleteWebhookHandler('w1')).toBeFalsy()
  })
})

describe('errors', () => {
  it('rejects with an API error describing the failed request', async () => {
    respond = () => jsonResponse({ message: 'nope' }, 404)
    const error = await createClient(CONFIG).webhooks.deleteWebhookHandler('w1').catch(e => e)
    expect(isApiError(error)).toBe(true)
    expect(error.status).toBe(404)
    expect(error.url).toBe('https://graph.example.com/api/webhooks/w1')
    expect(error.body).toEqual({ message: 'nope' })
    expect(error.message).toBeTruthy()
  })

  it('does not copy credentials into the error', async () => {
    respond = () => jsonResponse({ message: 'nope' }, 401)
    const error = await createClient(CONFIG).webhooks.listWebhookHandler().catch(e => e)
    expect(JSON.stringify({ ...error, message: error.message })).not.toContain(CONFIG.secret)
    expect(JSON.stringify({ ...error, message: error.message })).not.toMatch(/epi-hmac/)
  })

  it('identifies API errors only', () => {
    expect(isApiError(new Error('x'))).toBe(false)
    expect(isApiError(undefined)).toBe(false)
    expect(isApiError(null)).toBe(false)
    expect(isApiError({ status: 500 })).toBe(false)
    expect(isApiError({ status: 500, url: 'https://x' })).toBe(true)
  })
})
