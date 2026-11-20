import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/navigation.js', () => ({
  notFound: () => 'not-found'
}))
vi.mock('next/script.js', () => ({ default: () => null }))
vi.mock('next/cache.js', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn()
}))

import { NextRequest } from 'next/server.js'
import { createPublishApi } from '../src/publish/index.js'
import { createEditPageComponent } from '../src/ope/page.js'
import { getContentRequest } from '../src/ope/tools.js'
import { loadContent } from '../src/ope/load-content.js'
import { createAuthorizedClient } from '../src/client.js'

/** The outputs that end up on stdout */
let stdout: Array<MockInstance>

function stdoutCalls() {
  return stdout.reduce((total, spy) => total + spy.mock.calls.length, 0)
}

/** Exercise the code paths that report problems on regular (non-debug) usage */
async function triggerReports() {
  const client = (publishToken?: string) => ({ siteInfo: { publishToken } }) as never

  // Publish API: not configured, wrong token, and a request without data
  await createPublishApi({ client: client() })(new NextRequest('https://example.com/publish'))
  await createPublishApi({ client: client('secret') })(new NextRequest('https://example.com/publish?token=wrong'))
  await createPublishApi({ client: client('secret') })(new NextRequest('https://example.com/publish?token=secret'))

  // Edit page: invalid request and unresolvable content
  const page = createEditPageComponent({} as never, { requestValidator: () => false })
  await page({ params: Promise.resolve({}), searchParams: Promise.resolve({}) } as never)
  const unresolvablePage = createEditPageComponent({} as never, {
    requestValidator: () => true,
    contentResolver: () => undefined
  })
  await unresolvablePage({ params: Promise.resolve({}), searchParams: Promise.resolve({}) } as never)
  getContentRequest({ params: { path: [] }, searchParams: { preview_token: 'use-hmac' } } as never)

  // Content loading: failing loader and ambiguous result
  const graphClient = { getChangeset: () => undefined } as never
  await loadContent({ key: 'abc', locale: 'en' } as never, graphClient, () => Promise.reject(new Error('failed')))
  await loadContent({ key: 'abc', locale: 'en' } as never, graphClient, (() => Promise.resolve({ content: { total: 2, items: [] } })) as never)

  // Client creation with a mode as token, outside of development
  createAuthorizedClient('use-hmac', { app_key: 'a', secret: 'b', single_key: 'c', gateway: 'https://example.com', publish_token: 'secret' } as never)
}

beforeEach(() => {
  stdout = [
    vi.spyOn(console, 'log'),
    vi.spyOn(console, 'info'),
    vi.spyOn(console, 'debug'),
    vi.spyOn(console, 'group'),
    vi.spyOn(console, 'groupCollapsed'),
    vi.spyOn(process.stdout, 'write')
  ]
  // stderr output is not restricted, it is only muted to keep the test output clean
  const stderr = [
    vi.spyOn(console, 'warn'),
    vi.spyOn(console, 'error'),
    vi.spyOn(console, 'trace'),
    vi.spyOn(process.stderr, 'write')
  ]
  ;[...stdout, ...stderr].forEach(spy => spy.mockImplementation(() => true))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('stdout output', () => {
  it('is silent with NODE_ENV=production and OPTIMIZELY_DEBUG=0', async () => {
    expect(process.env.NODE_ENV).toBe('production')
    expect(process.env.OPTIMIZELY_DEBUG).toBe('0')
    await triggerReports()
    expect(stdoutCalls()).toBe(0)
  })

  it('is produced when NODE_ENV is not production', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    await triggerReports()
    expect(stdoutCalls()).toBeGreaterThan(0)
  })

  it('is produced when OPTIMIZELY_DEBUG is enabled', async () => {
    vi.stubEnv('OPTIMIZELY_DEBUG', '1')
    await triggerReports()
    expect(stdoutCalls()).toBeGreaterThan(0)
  })
})
