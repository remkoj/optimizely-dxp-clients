import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { ContentGraphClient } from '../src/client/client.js'
import { REQUEST_ID_HEADERS } from '../src/client/utils.js'

/**
 * The client is used several times in the critical path of dynamic requests, so
 * with all logging gates off it may only look up the request id: no logging, no
 * serialization, no body/headers handling and no environment reads.
 */

const REQUESTS = 50
const query = 'query getThing($key: String) { thing(key: $key) { total } }'

let stdout: MockInstance[]
let stderr: MockInstance[]

beforeEach(() => {
  stdout = [
    vi.spyOn(console, 'log'),
    vi.spyOn(console, 'info'),
    vi.spyOn(console, 'debug'),
    vi.spyOn(console, 'group'),
    vi.spyOn(console, 'groupCollapsed'),
    vi.spyOn(process.stdout, 'write')
  ]
  stderr = [
    vi.spyOn(console, 'warn'),
    vi.spyOn(console, 'error'),
    vi.spyOn(console, 'trace'),
    vi.spyOn(process.stderr, 'write')
  ]
  ;[...stdout, ...stderr].forEach(spy => spy.mockImplementation(() => true))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function calls(spies: MockInstance[]) {
  return spies.reduce((total, spy) => total + spy.mock.calls.length, 0)
}

function createClient() {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"data":{"thing":{"total":1}}}', {
    headers: { 'content-type': 'application/json', 'correlation-id': 'req-hot', 'x-other': 'a' }
  })))
  return new ContentGraphClient({ gateway: 'https://graph.example.com', single_key: 'singlekey-0123456789', debug: false, query_log: false })
}

describe('hot path with logging gates off', () => {
  it('does not write any output', async () => {
    const client = createClient()
    for (let i = 0; i < REQUESTS; i++)
      await client.request(query, { key: 'a' })
    expect(calls(stdout)).toBe(0)
    expect(calls(stderr)).toBe(0)
  })

  it('does not read the response body or iterate the response headers', async () => {
    const client = createClient()
    const forbidden = [
      vi.spyOn(Response.prototype, 'clone'),
      vi.spyOn(Response.prototype, 'json'),
      vi.spyOn(Headers.prototype, 'forEach'),
      vi.spyOn(Headers.prototype, 'entries'),
      vi.spyOn(Headers.prototype, 'keys'),
      vi.spyOn(Headers.prototype, 'values'),
      vi.spyOn(Headers.prototype, Symbol.iterator)
    ]
    const text = vi.spyOn(Response.prototype, 'text')
    const get = vi.spyOn(Headers.prototype, 'get')
    for (let i = 0; i < REQUESTS; i++)
      await client.request(query, { key: 'a' })
    expect(calls(forbidden)).toBe(0)
    // graphql-request reads the body once per request, we add nothing
    expect(text).toHaveBeenCalledTimes(REQUESTS)
    // graphql-request reads the content-type once per request, we add at most one lookup per id header
    expect(get.mock.calls.length).toBeLessThanOrEqual(REQUESTS * (1 + REQUEST_ID_HEADERS.length))
  })

  it('does not serialize the variables beyond what graphql-request does for the request body', async () => {
    const client = createClient()
    const toJSON = vi.fn(() => ({ key: 'a' }))
    await client.request(query, { toJSON } as never)
    expect(toJSON).toHaveBeenCalledTimes(1)
  })

  it('does not read the environment', async () => {
    const client = createClient()
    const originalEnv = process.env
    let reads = 0
    Object.defineProperty(process, 'env', {
      configurable: true,
      value: new Proxy(originalEnv, { get(target, property, receiver) { reads++; return Reflect.get(target, property, receiver) } })
    })
    try {
      for (let i = 0; i < REQUESTS; i++)
        await client.request(query, { key: 'a' })
    } finally {
      Object.defineProperty(process, 'env', { configurable: true, value: originalEnv })
    }
    expect(reads).toBe(0)
  })

  it('does not retain the response, headers or body', async () => {
    const client = createClient()
    await client.request(query, { key: 'a' })
    const seen = new Set<unknown>()
    const holders: string[] = []
    const walk = (value: unknown, path: string, depth: number) => {
      if (value === null || typeof value !== 'object' || seen.has(value) || depth > 6)
        return
      seen.add(value)
      if (value instanceof Response || value instanceof Headers)
        holders.push(path)
      for (const key of Reflect.ownKeys(value)) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key)
        if (descriptor && 'value' in descriptor)
          walk(descriptor.value, `${path}.${String(key)}`, depth + 1)
      }
    }
    walk(client, 'client', 0)
    expect(holders).toEqual([])
  })
})
