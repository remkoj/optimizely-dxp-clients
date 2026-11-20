import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAccessToken } from '../src/getaccesstoken'

describe('getAccessToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns an empty token without calling the network when credentials are missing', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(await getAccessToken({ clientId: 'id' } as never)).toBe('')
    expect(await getAccessToken({ clientSecret: 'secret' } as never)).toBe('')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends base64 encoded basic credentials and returns the access token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ access_token: 'token-value' }), { status: 200 })
    )
    vi.stubGlobal('fetch', fetchMock)

    const token = await getAccessToken({ clientId: 'my-id', clientSecret: 'my-secret' } as never, 'https://api.example.com/')

    expect(token).toBe('token-value')
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://api.example.com/oauth/token')
    expect((init.headers as Headers).get('Authorization')).toBe(`Basic ${btoa('my-id:my-secret')}`)
  })
})
