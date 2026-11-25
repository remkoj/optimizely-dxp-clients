import { describe, expect, it, vi } from 'vitest'
import { ApiClient, ApiError, withOperations } from '../src/index'
import type { ApiClientConfig, ApiClientNetworkClient } from '../src/index'

class TestClient extends ApiClient {
  public constructor(config: ApiClientConfig, client: ApiClientNetworkClient) {
    super(config, client)
  }
}

type TestApi = new (config: ApiClientConfig, client: ApiClientNetworkClient) => Record<string, (options: object) => Promise<unknown>>

function createNetworkClient(): ApiClientNetworkClient {
  return {
    interceptors: {
      request: { use: vi.fn(() => 0) },
      response: { use: vi.fn(() => 0) }
    }
  }
}

function createApi(operations: Record<string, unknown>) {
  return withOperations(TestClient, operations as never) as unknown as TestApi
}

describe('withOperations', () => {
  it('binds every operation as a method that injects the network client', async () => {
    const operation = vi.fn(async () => ({ data: { id: 1 } }))
    const networkClient = createNetworkClient()
    const Api = createApi({ getItem: operation, notAFunction: 'x' })
    const api = new Api({}, networkClient)

    expect(await api.getItem({ path: { id: 1 } })).toEqual({ id: 1 })
    expect(operation).toHaveBeenCalledWith({ throwOnError: false, client: networkClient, path: { id: 1 } })
    expect((api as unknown as Record<string, unknown>).notAFunction).toBeUndefined()
  })

  it('returns the full result when there is no data', async () => {
    const result = { request: new Request('https://cms.example.com/'), response: new Response(null, { status: 204 }) }
    const Api = createApi({ noContent: async () => result })

    expect(await new Api({}, createNetworkClient()).noContent({})).toBe(result)
  })

  it('throws an ApiError that preserves the full request and response of a failed operation', async () => {
    const request = new Request('https://cms.example.com/items?token=secret', { headers: { Authorization: 'Bearer secret-token' } })
    const response = new Response('{"detail":"secret body"}', { status: 404, statusText: 'Not Found' })
    const Api = createApi({ getItem: async () => ({ error: { detail: 'secret body' }, request, response }) })

    const failure = await new Api({}, createNetworkClient()).getItem({}).catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(ApiError)
    const apiError = failure as ApiError
    expect(apiError.request).toBe(request)
    expect(apiError.response).toBe(response)
    expect(apiError.data).toEqual({ detail: 'secret body' })
    expect(apiError.status).toBe(404)
  })

  it('uses the configured client name in the message of the ApiError', async () => {
    const response = new Response('{}', { status: 404, statusText: 'Not Found' })
    const Api = createApi({ getItem: async () => ({ error: { detail: 'x' }, request: new Request('https://graph.example.com/'), response }) })

    const failure = await new Api({ name: 'Graph Admin API' }, createNetworkClient()).getItem({}).catch((error: unknown) => error)

    expect((failure as ApiError).message).toBe('Optimizely Graph Admin API Error: 404 Not Found')
  })

  it('keeps the CMS API message for a client without a name', async () => {
    const response = new Response('{}', { status: 404, statusText: 'Not Found' })
    const Api = createApi({ getItem: async () => ({ error: { detail: 'x' }, request: new Request('https://cms.example.com/'), response }) })

    const failure = await new Api({}, createNetworkClient()).getItem({}).catch((error: unknown) => error)

    expect((failure as ApiError).message).toBe('Optimizely CMS API Error: 404 Not Found')
  })
})
