import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { ClientError } from 'graphql-request'
import { ContentGraphClient } from '../src/client/client.js'
import { OptiGraphRequestError } from '../src/client/errors.js'
import { AuthMode } from '../src/client/types.js'

const SINGLE_KEY = 'singlekey-0123456789'
const APP_KEY = 'appkey-0123456789'
const SECRET = 'secret-0123456789'
const query = 'query getThing($key: String) { thing(key: $key) { total } }'

type StubResponse = { status?: number, headers?: Record<string, string>, body: unknown }

/** Replace the global fetch (used by the client in public/basic mode) with a stub that returns the given responses in order, repeating the last one */
function stubFetch(...responses: StubResponse[]) {
  let call = 0
  const stub = vi.fn(async () => {
    const response = responses[Math.min(call++, responses.length - 1)]
    return new Response(JSON.stringify(response.body), {
      status: response.status ?? 200,
      headers: { 'content-type': 'application/json', ...response.headers }
    })
  })
  vi.stubGlobal('fetch', stub)
  return stub
}

function createClient(config: Record<string, unknown> = {}) {
  return new ContentGraphClient({ gateway: 'https://graph.example.com', single_key: SINGLE_KEY, app_key: APP_KEY, secret: SECRET, ...config })
}

let errorSpy: MockInstance
let logSpy: MockInstance

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function allOutput(...spies: MockInstance[]) {
  return spies.flatMap(spy => spy.mock.calls.flat()).map(x => typeof x === 'string' ? x : JSON.stringify(x)).join('\n')
}

describe('request id capture', () => {
  it('records the id of a successful request', async () => {
    stubFetch({ headers: { 'correlation-id': 'req-1' }, body: { data: { thing: { total: 1 } } } })
    const client = createClient()
    expect(client.getRequestId()).toBeUndefined()
    await expect(client.request(query, { key: 'a' })).resolves.toEqual({ thing: { total: 1 } })
    expect(client.getRequestId()).toBe('req-1')
    expect(client.getRequestId('getThing')).toBe('req-1')
    expect(client.getRequestId('somethingElse')).toBeUndefined()
  })

  it('records the id of a successful request without any results', async () => {
    stubFetch({ headers: { 'x-request-id': 'req-empty' }, body: { data: { thing: { total: 0 } } } })
    const client = createClient()
    await client.request(query, { key: 'a' })
    expect(client.getRequestId()).toBe('req-empty')
  })

  it('works when the response has no request id', async () => {
    stubFetch({ body: { data: { thing: { total: 1 } } } })
    const client = createClient()
    await expect(client.request(query, { key: 'a' })).resolves.toEqual({ thing: { total: 1 } })
    expect(client.getRequestId()).toBeUndefined()
  })

  it('returns the most recent id, optionally for a specific operation', async () => {
    stubFetch(
      { headers: { 'correlation-id': 'first' }, body: { data: {} } },
      { headers: { 'correlation-id': 'second' }, body: { data: {} } },
      { headers: { 'correlation-id': 'third' }, body: { data: {} } }
    )
    const client = createClient()
    await client.request('query opA { a }')
    await client.request('query opB { b }')
    await client.request('query opA { a }')
    expect(client.getRequestId()).toBe('third')
    expect(client.getRequestId('opA')).toBe('third')
    expect(client.getRequestId('opB')).toBe('second')
  })

  it('keeps at most 8 ids per client', async () => {
    let counter = 0
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"data":{}}', { headers: { 'content-type': 'application/json', 'correlation-id': `req-${counter++}` } })))
    const client = createClient()
    for (let i = 0; i < 100; i++)
      await client.request('query opA { a }')
    const internals = client as unknown as { _recentRequestIds: unknown[], _recentOperations: unknown[] }
    expect(internals._recentRequestIds).toHaveLength(8)
    expect(internals._recentOperations).toHaveLength(8)
    expect(internals._recentRequestIds.every(x => x === undefined || typeof x === 'string')).toBe(true)
    expect(internals._recentOperations.every(x => x === undefined || typeof x === 'string')).toBe(true)
    expect(client.getRequestId()).toBe('req-99')
  })
})

describe('request id on errors', () => {
  it('adds the id and status to the (unchanged) ClientError of a failed request and to the error output', async () => {
    stubFetch({ status: 500, headers: { 'correlation-id': 'req-500' }, body: { errors: [{ message: 'Boom' }] } })
    const client = createClient()
    const error = await client.request(query, { key: 'a' }).catch(e => e)
    expect(error).toBeInstanceOf(ClientError)
    expect(error.requestId).toBe('req-500')
    expect(error.status).toBe(500)
    expect(allOutput(errorSpy)).toContain('[request-id: req-500]')
    expect(client.getRequestId()).toBe('req-500')
  })

  it('adds the id and status to the ClientError of a GraphQL error', async () => {
    stubFetch({ headers: { 'correlation-id': 'req-gql' }, body: { errors: [{ message: 'Invalid query' }] } })
    const client = createClient()
    const error = await client.request(query, { key: 'a' }).catch(e => e)
    expect(error).toBeInstanceOf(ClientError)
    expect(error.requestId).toBe('req-gql')
    expect(error.status).toBe(200)
    expect(allOutput(errorSpy)).toContain('[request-id: req-gql]')
  })

  it('throws a lean OptiGraphRequestError when GraphQL errors are returned as data', async () => {
    stubFetch({ headers: { 'correlation-id': 'req-all' }, body: { data: null, errors: [{ message: 'Invalid query' }] } })
    const client = createClient()
    ;(client.requestConfig as { errorPolicy?: string }).errorPolicy = 'all'
    const error = await client.request('query getThing { thing { total } }').catch(e => e)
    expect(error).toBeInstanceOf(OptiGraphRequestError)
    expect(error.requestId).toBe('req-all')
    expect(error.status).toBe(200)
    expect(error.message).toContain('[request-id: req-all]')
    expect(allOutput(errorSpy)).toContain('[request-id: req-all]')
    expectOnlyPrimitives(error)
  })

  it('does not add anything when the response has no request id', async () => {
    stubFetch({ status: 500, body: { errors: [{ message: 'Boom' }] } })
    const client = createClient()
    const error = await client.request(query, { key: 'a' }).catch(e => e)
    expect(error.requestId).toBeUndefined()
    expect(allOutput(errorSpy)).not.toContain('request-id')
  })
})

/** Walk the own properties (incl. `cause`) of an error and make sure only primitives are held */
function expectOnlyPrimitives(error: object) {
  const seen = new Set<unknown>()
  const walk = (value: unknown, path: string) => {
    if (value === null || value === undefined || typeof value !== 'object') {
      expect(['string', 'number', 'boolean', 'undefined', 'function', 'object']).toContain(typeof value)
      return
    }
    if (seen.has(value))
      return
    seen.add(value)
    expect(value, path).not.toBeInstanceOf(Response)
    expect(value, path).not.toBeInstanceOf(Headers)
    expect(value, path).not.toBeInstanceOf(ClientError)
    for (const key of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (key === 'stack')
        continue
      expect(typeof descriptor?.value, `${path}.${String(key)}`).not.toBe('object')
    }
  }
  walk(error, 'error')
  expect((error as Error).cause).toBeUndefined()
}

describe('credentials in the output', () => {
  const secretValues = [SINGLE_KEY, APP_KEY, SECRET, Buffer.from(`${APP_KEY}:${SECRET}`).toString('base64'), 'tokentokentokentoken']

  it('are masked in the query log', async () => {
    stubFetch({ headers: { 'correlation-id': 'req-log' }, body: { data: { thing: { total: 1 } } } })
    for (const mode of [undefined, AuthMode.Basic, 'tokentokentokentoken']) {
      const client = createClient({ query_log: true })
      client.updateAuthentication(mode)
      await client.request(query, { key: 'a' })
    }
    const output = allOutput(logSpy, errorSpy)
    expect(output).toContain('[Request Headers]')
    expect(output).toContain('req-log')
    for (const value of secretValues)
      expect(output).not.toContain(value)
  })

  it('are masked in the debug output', () => {
    const client = createClient({ debug: true })
    client.updateAuthentication(AuthMode.Basic)
    client.updateAuthentication('tokentokentokentoken')
    client.setFrontendUser({ username: 'alice', roles: 'Editors' })
    const output = allOutput(logSpy, errorSpy)
    expect(output).toContain('Updating token to')
    expect(output).toContain('Updated service endpoint headers')
    for (const value of [...secretValues, 'alice'])
      expect(output).not.toContain(value)
  })
})
