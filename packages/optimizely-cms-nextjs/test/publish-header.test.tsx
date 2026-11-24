import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/cache.js', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn()
}))

import { NextRequest } from 'next/server.js'
import { revalidatePath } from 'next/cache.js'
import { createPublishApi } from '../src/publish/index.js'

const SECRET = 'correct-publish-secret'
const WRONG = 'wrong-publish-secret'

let spies: Record<'log' | 'info' | 'debug' | 'warn' | 'error', MockInstance>

beforeEach(() => {
  spies = {
    log: vi.spyOn(console, 'log'),
    info: vi.spyOn(console, 'info'),
    debug: vi.spyOn(console, 'debug'),
    warn: vi.spyOn(console, 'warn'),
    error: vi.spyOn(console, 'error')
  }
  Object.values(spies).forEach(spy => spy.mockImplementation(() => undefined))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.mocked(revalidatePath).mockReset()
})

function graphClient(siteInfo: { publishToken?: string; publishHeader?: string }) {
  return {
    siteInfo,
    updateAuthentication: () => undefined,
    request: async () => ({})
  } as never
}

function request(options: { headers?: Record<string, string>; query?: string } = {}) {
  return new NextRequest(`https://example.com/publish${options.query ?? ''}`, { headers: options.headers })
}

function allOutput(): string {
  return Object.values(spies)
    .flatMap(spy => spy.mock.calls.flat())
    .map(arg => (typeof arg == 'string' ? arg : JSON.stringify(arg)))
    .join('\n')
}

describe('publish API token header', () => {
  it('accepts the token in the default X-OPTLY-PUBLISH header', async () => {
    const api = createPublishApi({ client: graphClient({ publishToken: SECRET }) })
    expect((await api(request({ headers: { 'X-OPTLY-PUBLISH': SECRET } }))).status).toBe(200)
  })

  it('treats the header name as case-insensitive', async () => {
    const api = createPublishApi({ client: graphClient({ publishToken: SECRET, publishHeader: 'x-optimizely-graph-publish' }) })
    expect((await api(request({ headers: { 'X-Optimizely-Graph-Publish': SECRET } }))).status).toBe(200)
  })

  it('reads the token from the configured header only', async () => {
    const api = createPublishApi({ client: graphClient({ publishToken: SECRET, publishHeader: 'x-vercel-protection-bypass' }) })
    expect((await api(request({ headers: { 'x-vercel-protection-bypass': SECRET } }))).status).toBe(200)
    expect((await api(request({ headers: { 'X-OPTLY-PUBLISH': SECRET } }))).status).toBe(401)
  })

  it('rejects a wrong token, a token of a different length and a missing token', async () => {
    const api = createPublishApi({ client: graphClient({ publishToken: SECRET }) })
    for (const headers of [{ 'X-OPTLY-PUBLISH': WRONG }, { 'X-OPTLY-PUBLISH': SECRET + 'x' }, { 'X-OPTLY-PUBLISH': '' }, {}]) {
      const response = await api(request({ headers }))
      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Not authorized' })
    }
  })

  it('rejects every request when no publish token is configured', async () => {
    const api = createPublishApi({ client: graphClient({}) })
    expect((await api(request({ headers: { 'X-OPTLY-PUBLISH': 'anything' } }))).status).toBe(401)
    expect((await api(request({ headers: { 'X-OPTLY-PUBLISH': '' } }))).status).toBe(401)
  })

  it('never writes a supplied or configured token to the output', async () => {
    const api = createPublishApi({ client: graphClient({ publishToken: SECRET }) })
    await api(request({ headers: { 'X-OPTLY-PUBLISH': WRONG } }))
    await api(request({ query: `?token=${WRONG}` }))
    await api(request({ headers: { 'X-OPTLY-PUBLISH': SECRET } }))
    expect(allOutput()).not.toContain(WRONG)
    expect(allOutput()).not.toContain(SECRET)
  })

  it('does not return error details to the caller when processing fails', async () => {
    vi.mocked(revalidatePath).mockImplementation(() => {
      throw new Error('internal detail /srv/app/secret')
    })
    const api = createPublishApi({ client: graphClient({ publishToken: SECRET }) })
    const response = await api(request({ headers: { 'X-OPTLY-PUBLISH': SECRET } }))
    expect(response.status).toBe(500)
    expect(JSON.stringify(await response.json())).not.toContain('internal detail')
  })
})

describe('publish API deprecated token query parameter', () => {
  it('still accepts ?token= and warns without exposing the token', async () => {
    const api = createPublishApi({ client: graphClient({ publishToken: SECRET }) })
    expect((await api(request({ query: `?token=${SECRET}` }))).status).toBe(200)
    expect(spies.warn).toHaveBeenCalledTimes(1)
    expect(String(spies.warn.mock.calls[0][0])).toContain('deprecated')
    expect(allOutput()).not.toContain(SECRET)
  })

  it('warns only once per publish API', async () => {
    const api = createPublishApi({ client: graphClient({ publishToken: SECRET }) })
    await api(request({ query: `?token=${SECRET}` }))
    await api(request({ query: `?token=${SECRET}` }))
    expect(spies.warn).toHaveBeenCalledTimes(1)
  })

  it('does not warn when the header is used', async () => {
    const api = createPublishApi({ client: graphClient({ publishToken: SECRET }) })
    await api(request({ headers: { 'X-OPTLY-PUBLISH': SECRET } }))
    expect(spies.warn).not.toHaveBeenCalled()
  })

  it('gives the header precedence over the query parameter', async () => {
    const api = createPublishApi({ client: graphClient({ publishToken: SECRET }) })
    expect((await api(request({ headers: { 'X-OPTLY-PUBLISH': WRONG }, query: `?token=${SECRET}` }))).status).toBe(401)
  })
})
