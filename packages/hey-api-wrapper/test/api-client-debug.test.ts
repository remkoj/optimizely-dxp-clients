import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { ApiClient } from '../src/index'
import type { ApiClientConfig, ApiClientNetworkClient } from '../src/index'

class TestClient extends ApiClient {
  public constructor(config: ApiClientConfig, client: ApiClientNetworkClient) {
    super(config, client)
  }
}

type RequestInterceptor = Parameters<ApiClientNetworkClient['interceptors']['request']['use']>[0]
type ResponseInterceptor = Parameters<ApiClientNetworkClient['interceptors']['response']['use']>[0]

let log: MockInstance<typeof console.log>

function createDebugClient() {
  const interceptors: { request?: RequestInterceptor, response?: ResponseInterceptor } = {}
  const networkClient: ApiClientNetworkClient = {
    interceptors: {
      request: { use: interceptor => { interceptors.request = interceptor; return 0 } },
      response: { use: interceptor => { interceptors.response = interceptor; return 0 } }
    }
  }
  new TestClient({ debug: true, name: 'Test' }, networkClient)
  return interceptors as Required<typeof interceptors>
}

/** Concatenates everything that was written to the console */
function logged() {
  return log.mock.calls.map(call => call.join(' ')).join('\n')
}

beforeEach(() => {
  log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ApiClient debug logging', () => {
  it('does not register interceptors when debug is disabled', () => {
    const use = vi.fn(() => 0)
    new TestClient({}, { interceptors: { request: { use }, response: { use } } })

    expect(use).not.toHaveBeenCalled()
  })

  it('logs requests and responses and returns them unmodified', async () => {
    const interceptors = createDebugClient()
    const request = new Request('https://cms.example.com/api/items', { method: 'GET' })
    const response = new Response('{}', { status: 200, statusText: 'OK', headers: { 'Content-Type': 'application/json' } })

    expect(await interceptors.request(request)).toBe(request)
    expect(await interceptors.response(response, request)).toBe(response)
    expect(log).toHaveBeenCalledWith('🔍 [Test] Sending GET request to https://cms.example.com/api/items')
    expect(log).toHaveBeenCalledWith('✨ [Test] Received response 200 OK of type application/json for https://cms.example.com/api/items')
  })

  it('masks the query string values in the logged request URL', async () => {
    const interceptors = createDebugClient()
    const request = new Request('https://cms.example.com/api/items?api_key=SECRET1&page=2')

    await interceptors.request(request)

    expect(logged()).toContain('https://cms.example.com/api/items?api_key=***&page=***')
    expect(logged()).not.toContain('SECRET1')
    // The request itself is never modified
    expect(request.url).toBe('https://cms.example.com/api/items?api_key=SECRET1&page=2')
  })

  it('masks the query string values in the logged response URL', async () => {
    const interceptors = createDebugClient()
    const request = new Request('https://cms.example.com/api/items?access_token=SECRET2')

    await interceptors.response(new Response('{}', { status: 401, statusText: 'Unauthorized' }), request)

    expect(logged()).toContain('https://cms.example.com/api/items?access_token=***')
    expect(logged()).not.toContain('SECRET2')
  })

  it('does not log credentials embedded in the URL', async () => {
    const interceptors = createDebugClient()

    // The Request constructor rejects credentials in the URL, but other implementations might not
    await interceptors.request({ method: 'GET', url: 'https://user:PASSWORD@cms.example.com/api' } as Request)

    expect(logged()).toContain('https://cms.example.com/api')
    expect(logged()).not.toContain('PASSWORD')
  })

  it('keeps the host and path and does not log the fragment', async () => {
    const interceptors = createDebugClient()

    await interceptors.request(new Request('https://cms.example.com:8443/a/b%20c?x=1#frag'))

    expect(logged()).toContain('https://cms.example.com:8443/a/b%20c?x=***')
    expect(logged()).not.toContain('frag')
  })

  it('uses the client name as the prefix of the logged response', async () => {
    const interceptors = createDebugClient()
    const request = new Request('https://graph.example.com/api')

    await interceptors.response(new Response(null, { status: 200, statusText: 'OK' }), request)

    expect(log).toHaveBeenCalledWith('✨ [Test] Received response 200 OK of type unknown for https://graph.example.com/api')
  })

  it('keeps the CMS API prefix for the logged response of a client without a name', async () => {
    const interceptors: { response?: ResponseInterceptor } = {}
    new TestClient({ debug: true }, {
      interceptors: {
        request: { use: () => 0 },
        response: { use: interceptor => { interceptors.response = interceptor; return 0 } }
      }
    })

    await interceptors.response?.(new Response(null, { status: 200, statusText: 'OK' }), new Request('https://cms.example.com/api'))

    expect(log).toHaveBeenCalledWith('✨ [CMS API] Received response 200 OK of type unknown for https://cms.example.com/api')
  })
})
