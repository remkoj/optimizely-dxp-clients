import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient } from '../src/index'
import { DEFAULT_API_BASEURL, getAuthBaseUrl, readPartialEnvConfig, resolveApiBaseUrl } from '../src/config'

const ENV_KEYS = [
  'OPTIMIZELY_CMS_API_BASEURL',
  'OPTIMIZELY_CMS_URL',
  'OPTIMIZELY_CMS_CLIENT_ID',
  'OPTIMIZELY_CMS_CLIENT_SECRET'
]

/**
 * Creates a fetch mock that answers token and API requests, so the tests can
 * assert on the URLs the client targets without touching the network.
 */
function stubFetch() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input))
    if (url.pathname.endsWith('/oauth/token'))
      return new Response(JSON.stringify({ access_token: 'token-value' }), { status: 200 })
    return new Response(JSON.stringify({ items: [] }), { status: 200, headers: { 'content-type': 'application/json' } })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/**
 * Executes a request through the client and returns the URLs that were requested.
 */
async function requestedUrls(client: ReturnType<typeof createClient>, fetchMock: ReturnType<typeof stubFetch>): Promise<string[]> {
  await client.contentTypesList()
  return fetchMock.mock.calls.map(([input]) => input instanceof Request ? input.url : String(input))
}

describe('Integration API host configuration', () => {
  beforeEach(() => {
    ENV_KEYS.forEach(key => vi.stubEnv(key, ''))
    vi.stubEnv('OPTIMIZELY_CMS_CLIENT_ID', 'my-id')
    vi.stubEnv('OPTIMIZELY_CMS_CLIENT_SECRET', 'my-secret')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  describe('configuration', () => {
    it('defaults to the production API gateway when nothing is configured', () => {
      expect(DEFAULT_API_BASEURL.href).toBe('https://api.cms.optimizely.com/v1')
      const config = readPartialEnvConfig()
      expect(config.apiBaseUrl).toBeUndefined()
      expect(config.base).toBeUndefined()
    })

    it('resolves OPTIMIZELY_CMS_API_BASEURL to a non-production host', () => {
      vi.stubEnv('OPTIMIZELY_CMS_API_BASEURL', 'https://api.cmstest.optimizely.com/v1')
      expect(readPartialEnvConfig().apiBaseUrl?.href).toBe('https://api.cmstest.optimizely.com/v1')
    })

    it('keeps the explicit API base URL exactly as configured', () => {
      vi.stubEnv('OPTIMIZELY_CMS_API_BASEURL', 'https://api.cmstest.optimizely.com/v1/')
      expect(readPartialEnvConfig().apiBaseUrl?.href).toBe('https://api.cmstest.optimizely.com/v1/')
    })

    it('rejects an invalid OPTIMIZELY_CMS_API_BASEURL', () => {
      vi.stubEnv('OPTIMIZELY_CMS_API_BASEURL', 'not a url')
      expect(() => readPartialEnvConfig()).toThrow('Invalid Optimizely CMS API Base URL Provided')
    })

    it('derives the production gateway from a production SaaS CMS URL', () => {
      vi.stubEnv('OPTIMIZELY_CMS_URL', 'https://example.cms.optimizely.com')
      expect(readPartialEnvConfig().apiBaseUrl?.href).toBe('https://api.cms.optimizely.com/v1')
    })

    it('adds the https protocol to a CMS URL without one', () => {
      vi.stubEnv('OPTIMIZELY_CMS_URL', 'example.cms.optimizely.com')
      expect(readPartialEnvConfig().base?.href).toBe('https://example.cms.optimizely.com/')
    })

    it('does not infer the gateway of a non-production CMS URL', () => {
      vi.stubEnv('OPTIMIZELY_CMS_URL', 'https://example.cmstest.optimizely.com')
      expect(readPartialEnvConfig().apiBaseUrl?.href).toBe('https://example.cmstest.optimizely.com/_cms/v1')
    })

    it('lets OPTIMIZELY_CMS_API_BASEURL win over OPTIMIZELY_CMS_URL', () => {
      vi.stubEnv('OPTIMIZELY_CMS_URL', 'https://example.cms.optimizely.com')
      vi.stubEnv('OPTIMIZELY_CMS_API_BASEURL', 'https://api.cmstest.optimizely.com/v1')
      const config = readPartialEnvConfig()
      expect(config.base?.href).toBe('https://example.cms.optimizely.com/')
      expect(config.apiBaseUrl?.href).toBe('https://api.cmstest.optimizely.com/v1')
    })

    it('resolves nothing when neither a CMS URL nor an API base URL is given', () => {
      expect(resolveApiBaseUrl({})).toBeUndefined()
    })

    it('serves the token endpoint from the host root for managed gateways and from /_cms/v1/ otherwise', () => {
      expect(getAuthBaseUrl('https://api.cms.optimizely.com/v1').href).toBe('https://api.cms.optimizely.com/')
      expect(getAuthBaseUrl('https://api.cmstest.optimizely.com/v1').href).toBe('https://api.cmstest.optimizely.com/')
      expect(getAuthBaseUrl('https://cms.example.com/_cms/v1').href).toBe('https://cms.example.com/_cms/v1/')
    })
  })

  describe('requests', () => {
    it('sends requests to the production gateway when nothing is configured', async () => {
      const fetchMock = stubFetch()
      const client = createClient()

      const urls = await requestedUrls(client, fetchMock)

      expect(client.client.getConfig().baseUrl).toBe('https://api.cms.optimizely.com/v1')
      expect(urls.at(-1)).toBe('https://api.cms.optimizely.com/v1/contenttypes')
    })

    it('sends API and token requests to the host from OPTIMIZELY_CMS_API_BASEURL', async () => {
      vi.stubEnv('OPTIMIZELY_CMS_API_BASEURL', 'https://api.cmstest.optimizely.com/v1')
      const fetchMock = stubFetch()
      const client = createClient()

      const urls = await requestedUrls(client, fetchMock)

      expect(urls).toContain('https://api.cmstest.optimizely.com/oauth/token')
      expect(urls.at(-1)).toBe('https://api.cmstest.optimizely.com/v1/contenttypes')
      expect(urls.filter(url => url.includes('api.cms.optimizely.com'))).toEqual([])
    })

    it('does not produce a double slash when the configured host has a trailing slash', async () => {
      vi.stubEnv('OPTIMIZELY_CMS_API_BASEURL', 'https://api.cmstest.optimizely.com/v1/')
      const fetchMock = stubFetch()

      const urls = await requestedUrls(createClient(), fetchMock)

      expect(urls.at(-1)).toBe('https://api.cmstest.optimizely.com/v1/contenttypes')
    })

    it('uses an explicitly passed apiBaseUrl over the environment', async () => {
      vi.stubEnv('OPTIMIZELY_CMS_API_BASEURL', 'https://api.cmstest.optimizely.com/v1')
      const fetchMock = stubFetch()
      const client = createClient({
        clientId: 'my-id',
        clientSecret: 'my-secret',
        apiBaseUrl: new URL('https://api.cmsother.optimizely.com/v1')
      })

      const urls = await requestedUrls(client, fetchMock)

      expect(urls.at(-1)).toBe('https://api.cmsother.optimizely.com/v1/contenttypes')
    })

    it('sends requests to the _cms/v1 path of a non-production OPTIMIZELY_CMS_URL', async () => {
      vi.stubEnv('OPTIMIZELY_CMS_URL', 'https://example.cmstest.optimizely.com')
      const fetchMock = stubFetch()

      const urls = await requestedUrls(createClient(), fetchMock)

      expect(urls).toContain('https://example.cmstest.optimizely.com/_cms/v1/oauth/token')
      expect(urls.at(-1)).toBe('https://example.cmstest.optimizely.com/_cms/v1/contenttypes')
    })

    it('prefers OPTIMIZELY_CMS_API_BASEURL over OPTIMIZELY_CMS_URL for requests', async () => {
      vi.stubEnv('OPTIMIZELY_CMS_URL', 'https://example.cms.optimizely.com')
      vi.stubEnv('OPTIMIZELY_CMS_API_BASEURL', 'https://api.cmstest.optimizely.com/v1')
      const fetchMock = stubFetch()
      const client = createClient()

      const urls = await requestedUrls(client, fetchMock)

      expect(urls.at(-1)).toBe('https://api.cmstest.optimizely.com/v1/contenttypes')
      expect(client.cmsUrl?.href).toBe('https://example.cms.optimizely.com/')
    })
  })
})
