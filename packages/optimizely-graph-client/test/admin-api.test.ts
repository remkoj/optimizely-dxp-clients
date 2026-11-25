import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@remkoj/hey-api-wrapper'
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
  return new Response(JSON.stringify(data), { status, statusText: status === 404 ? 'Not Found' : undefined, headers: { 'content-type': 'application/json' } })
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
    await createClient({ single_key: 'single-key', gateway: 'https://graph.example.com' }).listWebhookHandler()
    expect(requests[0].authorization).toBeNull()
  })
})

describe('request signing', () => {
  it('signs every request with an epi-hmac Authorization header and identifies the client', async () => {
    await createClient(CONFIG).listWebhookHandler()
    expect(requests).toHaveLength(1)
    expect(requests[0].authorization).toMatch(/^epi-hmac app-key:\d+:[^:]+:[A-Za-z0-9+/=]+$/)
    expect(requests[0].xClient).toBe('@RemkoJ/OptimizelyGraphClient')
  })

  it('signs the body that is actually sent', async () => {
    const payload = { request: { url: 'https://site.example.com/publish', method: 'POST' } }
    await createClient(CONFIG).createWebhookHandler({ body: payload })
    expect(requests[0].body).toBe(JSON.stringify(payload))
    expect(requests[0].authorization).toMatch(/^epi-hmac app-key:/)
  })

  it('does not write to the console', async () => {
    const spies = [vi.spyOn(console, 'log'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'error')]
    await createClient(CONFIG).createWebhookHandler({ body: { request: { url: 'https://site.example.com/publish' } } })
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
  { name: 'getBestBetCollectionHandler', call: api => api.getBestBetCollectionHandler({ query: { id: 'a', page: 2 } }), expected: { method: 'GET', path: '/api/bestbets/collection', query: { id: ['a'], page: ['2'] } } },
  { name: 'createBestBetCollectionHandler', call: api => api.createBestBetCollectionHandler({ body: { name: 'n' } as never }), expected: { method: 'POST', path: '/api/bestbets/collection', body: json({ name: 'n' }), contentType: 'application/json' } },
  { name: 'updateBestBetCollectionHandler', call: api => api.updateBestBetCollectionHandler({ path: { id: 'id1' }, body: { name: 'n' } as never }), expected: { method: 'PUT', path: '/api/bestbets/collection/id1', body: json({ name: 'n' }), contentType: 'application/json' } },
  { name: 'deleteBestBetCollectionHandler', call: api => api.deleteBestBetCollectionHandler({ path: { id: 'id1' } }), expected: { method: 'DELETE', path: '/api/bestbets/collection/id1' } },
  // Definition v2
  { name: 'postContentV2DataHandler (text body)', call: api => api.postContentV2DataHandler({ query: { id: 'src' }, body: '{"a":1}\n' as never, bodySerializer: null }), expected: { method: 'POST', path: '/api/content/v2/data', query: { id: ['src'] }, body: '{"a":1}\n', contentType: 'application/json' } },
  { name: 'deleteContentV2DataHandler', call: api => api.deleteContentV2DataHandler({ query: { id: 'src', languages: ['en', 'nl'] } }), expected: { method: 'DELETE', path: '/api/content/v2/data', query: { id: ['src'], languages: ['en', 'nl'] } } },
  { name: 'postContentV2TypeHandler', call: api => api.postContentV2TypeHandler({ body: { id: 'x' } as never }), expected: { method: 'POST', path: '/api/content/v2/types', body: json({ id: 'x' }), contentType: 'application/json' } },
  // Definition v3
  { name: 'getContentV3SourceHandler (all)', call: api => api.getContentV3SourceHandler(), expected: { method: 'GET', path: '/api/content/v3/sources' } },
  { name: 'getContentV3SourceHandler (one)', call: api => api.getContentV3SourceHandler({ query: { id: 'src', slot: 'new' as never, count: '5' } }), expected: { method: 'GET', path: '/api/content/v3/sources', query: { id: ['src'], slot: ['new'], count: ['5'] } } },
  { name: 'deleteContentV3SourceHandler', call: api => api.deleteContentV3SourceHandler({ query: { id: 'src', mode: 'data' as never, slot: 'old' as never } }), expected: { method: 'DELETE', path: '/api/content/v3/sources', query: { id: ['src'], mode: ['data'], slot: ['old'] } } },
  { name: 'postContentV3SourceHandler', call: api => api.postContentV3SourceHandler({ query: { id: 'src', slot: 'new' as never }, body: { label: 'l', description: 'd' } }), expected: { method: 'POST', path: '/api/content/v3/sources', query: { id: ['src'], slot: ['new'] }, body: json({ label: 'l', description: 'd' }), contentType: 'application/json' } },
  { name: 'getContentV3TypeHandler', call: api => api.getContentV3TypeHandler({ query: { id: 'default' } }), expected: { method: 'GET', path: '/api/content/v3/types', query: { id: ['default'] } } },
  { name: 'postContentV3TypeHandler', call: api => api.postContentV3TypeHandler({ query: { id: 'src' }, body: { a: 1 } as never }), expected: { method: 'POST', path: '/api/content/v3/types', query: { id: ['src'] }, body: json({ a: 1 }), contentType: 'application/json' } },
  { name: 'putContentV3TypeHandler', call: api => api.putContentV3TypeHandler({ body: { a: 1 } as never }), expected: { method: 'PUT', path: '/api/content/v3/types', body: json({ a: 1 }), contentType: 'application/json' } },
  // Logs
  { name: 'getRequestLogHandler', call: api => api.getRequestLogHandler({ query: { page: 1, requestId: 'rid', host: 'host', path: '/p', success: true } }), expected: { method: 'GET', path: '/api/logs/request', query: { page: ['1'], requestId: ['rid'], host: ['host'], path: ['/p'], success: ['true'] } } },
  // OIDC
  { name: 'upsertOidcConfigHandler', call: api => api.upsertOidcConfigHandler({ body: { iss: 'x' } as never }), expected: { method: 'PUT', path: '/api/config/oidc', body: json({ iss: 'x' }), contentType: 'application/json' } },
  { name: 'deleteOidcConfigHandler', call: api => api.deleteOidcConfigHandler(), expected: { method: 'DELETE', path: '/api/config/oidc' } },
  // Pinned results
  { name: 'listPinnedCollectionHandler', call: api => api.listPinnedCollectionHandler({ query: { page: 1, sort: 'title' } }), expected: { method: 'GET', path: '/api/pinned/collections', query: { page: ['1'], sort: ['title'] } } },
  { name: 'createPinnedCollectionHandler', call: api => api.createPinnedCollectionHandler({ body: { title: 't' } as never }), expected: { method: 'POST', path: '/api/pinned/collections', body: json({ title: 't' }), contentType: 'application/json' } },
  { name: 'getPinnedCollectionHandler', call: api => api.getPinnedCollectionHandler({ path: { collectionId: 'c1' } }), expected: { method: 'GET', path: '/api/pinned/collections/c1' } },
  { name: 'updatePinnedCollectionHandler', call: api => api.updatePinnedCollectionHandler({ path: { collectionId: 'c1' }, body: { title: 't' } as never }), expected: { method: 'PUT', path: '/api/pinned/collections/c1', body: json({ title: 't' }), contentType: 'application/json' } },
  { name: 'deletePinnedCollectionHandler', call: api => api.deletePinnedCollectionHandler({ path: { collectionId: 'c1' } }), expected: { method: 'DELETE', path: '/api/pinned/collections/c1' } },
  { name: 'listPinnedItemHandler', call: api => api.listPinnedItemHandler({ path: { collectionId: 'c1' }, query: { limit: 10, offset: 5, phrase: 'ph', sort: 'sort' } }), expected: { method: 'GET', path: '/api/pinned/collections/c1/items', query: { limit: ['10'], offset: ['5'], phrase: ['ph'], sort: ['sort'] } } },
  { name: 'createPinnedItemHandler', call: api => api.createPinnedItemHandler({ path: { collectionId: 'c1' }, body: { phrase: 'p' } as never }), expected: { method: 'POST', path: '/api/pinned/collections/c1/items', body: json({ phrase: 'p' }), contentType: 'application/json' } },
  { name: 'clearPinnedItemHandler', call: api => api.clearPinnedItemHandler({ path: { collectionId: 'c1' } }), expected: { method: 'DELETE', path: '/api/pinned/collections/c1/items' } },
  { name: 'getPinnedItemHandler', call: api => api.getPinnedItemHandler({ path: { collectionId: 'c1', id: 'i1' } }), expected: { method: 'GET', path: '/api/pinned/collections/c1/items/i1' } },
  { name: 'updatePinnedItemHandler', call: api => api.updatePinnedItemHandler({ path: { collectionId: 'c1', id: 'i1' }, body: { phrase: 'p' } as never }), expected: { method: 'PUT', path: '/api/pinned/collections/c1/items/i1', body: json({ phrase: 'p' }), contentType: 'application/json' } },
  { name: 'deletePinnedItemHandler', call: api => api.deletePinnedItemHandler({ path: { collectionId: 'c1', id: 'i1' } }), expected: { method: 'DELETE', path: '/api/pinned/collections/c1/items/i1' } },
  { name: 'matchPinnedItemHandler', call: api => api.matchPinnedItemHandler({ body: { phrase: 'p' } as never }), expected: { method: 'POST', path: '/api/pinned/results', body: json({ phrase: 'p' }), contentType: 'application/json' } },
  // Query
  { name: 'getGraphQlv2Handler', call: api => api.getGraphQlv2Handler({ query: { query: '{a}', operationName: 'op', variables: '{}', sources: 's', lite: 'l' } }), expected: { method: 'GET', path: '/content/v2', query: { query: ['{a}'], operationName: ['op'], variables: ['{}'], sources: ['s'], lite: ['l'] } } },
  { name: 'postGraphQlv2Handler', call: api => api.postGraphQlv2Handler({ query: { sources: 's', lite: 'l' }, body: { query: '{a}' } as never }), expected: { method: 'POST', path: '/content/v2', query: { sources: ['s'], lite: ['l'] }, body: json({ query: '{a}' }), contentType: 'application/json' } },
  // Resources
  { name: 'upsertStopwordHandler', call: api => api.upsertStopwordHandler({ query: { language_routing: 'en', source_routing: 'src' }, body: '{"stopwords":["a"]}' as never, bodySerializer: null }), expected: { method: 'PUT', path: '/resources/stopwords', query: { language_routing: ['en'], source_routing: ['src'] }, body: json({ stopwords: ['a'] }), contentType: 'text/plain' } },
  { name: 'deleteStopwordHandler', call: api => api.deleteStopwordHandler({ query: { language_routing: 'en' } }), expected: { method: 'DELETE', path: '/resources/stopwords', query: { language_routing: ['en'] } } },
  { name: 'listSynonymHandler', call: api => api.listSynonymHandler({ query: { language_routing: 'en', source_routing: 'src', synonym_slot: 'two' } }), expected: { method: 'GET', path: '/resources/synonyms', query: { language_routing: ['en'], source_routing: ['src'], synonym_slot: ['two'] } } },
  { name: 'upsertSynonymHandler', call: api => api.upsertSynonymHandler({ query: { synonym_slot: 'one' }, body: '{"synonyms":["a"]}' as never, bodySerializer: null }), expected: { method: 'PUT', path: '/resources/synonyms', query: { synonym_slot: ['one'] }, body: json({ synonyms: ['a'] }), contentType: 'text/plain' } },
  { name: 'deleteSynonymHandler', call: api => api.deleteSynonymHandler({ query: { language_routing: 'en', source_routing: 'src' } }), expected: { method: 'DELETE', path: '/resources/synonyms', query: { language_routing: ['en'], source_routing: ['src'] } } },
  // Webhooks
  { name: 'listWebhookHandler', call: api => api.listWebhookHandler(), expected: { method: 'GET', path: '/api/webhooks' } },
  { name: 'createWebhookHandler', call: api => api.createWebhookHandler({ body: { request: { url: 'https://a/b', method: 'POST', headers: { 'X-Test': 'v' } } } }), expected: { method: 'POST', path: '/api/webhooks', body: json({ request: { url: 'https://a/b', method: 'POST', headers: { 'X-Test': 'v' } } }), contentType: 'application/json' } },
  { name: 'deleteWebhookHandler', call: api => api.deleteWebhookHandler({ path: { id: 'w/1' } }), expected: { method: 'DELETE', path: '/api/webhooks/w%2F1' } },
  { name: 'updateWebhookHandler', call: api => api.updateWebhookHandler({ path: { id: 'w1' }, body: { request: { url: 'https://a/b' } } }), expected: { method: 'PUT', path: '/api/webhooks/w1', body: json({ request: { url: 'https://a/b' } }), contentType: 'application/json' } },
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
    await expect(createClient(CONFIG).listWebhookHandler()).resolves.toEqual(hooks)
  })

  it('returns the source map', async () => {
    respond = () => jsonResponse({ default: { id: 'default', label: 'l', languages: ['en'] } })
    await expect(createClient(CONFIG).getContentV3SourceHandler()).resolves.toEqual({
      default: { id: 'default', label: 'l', languages: ['en'] }
    })
  })

  it('resolves to the raw result for an empty response', async () => {
    respond = () => new Response(null, { status: 204 })
    const result = await createClient(CONFIG).deleteWebhookHandler({ path: { id: 'w1' } }) as unknown as { response: Response }
    expect(result.response.status).toBe(204)
  })
})

describe('errors', () => {
  it('rejects with an API error describing the failed request', async () => {
    respond = () => jsonResponse({ message: 'nope' }, 404)
    const error = await createClient(CONFIG).deleteWebhookHandler({ path: { id: 'w1' } }).catch(e => e)
    expect(isApiError(error)).toBe(true)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(404)
    expect(error.request.url).toBe('https://graph.example.com/api/webhooks/w1')
    expect(error.data).toEqual({ message: 'nope' })
    expect(error.message).toBe('Optimizely Graph Admin API Error: 404 Not Found')
  })

  it('does not copy credentials into the error', async () => {
    respond = () => jsonResponse({ message: 'nope' }, 401)
    const error = await createClient(CONFIG).listWebhookHandler().catch(e => e)
    expect(error.message).not.toContain(CONFIG.secret)
    expect(error.request.headers.get('authorization')).toBeNull()
    expect(error.message).not.toMatch(/epi-hmac/)
  })

  it('identifies API errors only', () => {
    expect(isApiError(new Error('x'))).toBe(false)
    expect(isApiError(undefined)).toBe(false)
    expect(isApiError(null)).toBe(false)
    expect(isApiError({ status: 500 })).toBe(false)
    expect(isApiError({ status: 500, url: 'https://x' })).toBe(false)
  })
})
