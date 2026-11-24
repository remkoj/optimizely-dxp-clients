import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/navigation.js', () => ({
  notFound: () => 'not-found'
}))

import { loadContentByPath } from '../src/cms-page/_loadContentByPath.js'
import { createPage } from '../src/cms-page/page.js'

let errorSpy: MockInstance
let stdout: MockInstance[]

function errorOutput() {
  return errorSpy.mock.calls.flat().map(x => typeof x === 'string' ? x : JSON.stringify(x)).join('\n')
}

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  stdout = [
    vi.spyOn(console, 'log'),
    vi.spyOn(console, 'info'),
    vi.spyOn(console, 'debug'),
    vi.spyOn(process.stdout, 'write')
  ]
  stdout.forEach(spy => spy.mockImplementation(() => true))
})

afterEach(() => {
  vi.restoreAllMocks()
})

function mockClient(requestId?: string) {
  return {
    debug: false,
    isPreviewEnabled: () => false,
    getChangeset: () => null,
    currentOptiCmsSchema: 'OPTI-CMS-13',
    updateAuthentication: () => undefined,
    request: async () => ({}),
    getRequestId: requestId ? () => requestId : undefined
  } as never
}

describe('loadContentByPath', () => {
  it('reports the request id, the path and the variables for an empty resultset', async () => {
    const result = await loadContentByPath(mockClient('req-empty'), (async () => ({ content: { total: 0, items: [] } })) as never, '/missing/', 'site-1', 'en' as never, 'blue')
    expect(result).toBeUndefined()
    const output = errorOutput()
    expect(output).toContain('Unable to load content for /missing/, empty resultset received')
    expect(output).toContain('[request-id: req-empty]')
    expect(output).toContain('"path":["/missing/","/missing"]')
    expect(output).toContain('"siteId":"site-1"')
    expect(output).toContain('"locale":"en"')
    expect(stdout.reduce((total, spy) => total + spy.mock.calls.length, 0)).toBe(0)
  })

  it('caps the variables that are reported', async () => {
    await loadContentByPath(mockClient('req-long'), (async () => ({ content: { total: 0 } })) as never, '/' + 'a'.repeat(10000))
    const [line] = errorSpy.mock.calls[0] as [string]
    const variables = line.substring(line.indexOf('[variables: '))
    expect(variables.length).toBeLessThan(2100)
    expect(variables).toContain('…')
    expect(line).toContain('[request-id: req-long]')
  })

  it('still reports the empty resultset when the client has no request id', async () => {
    await loadContentByPath(mockClient(), (async () => ({ content: { total: 0 } })) as never, '/missing/')
    const output = errorOutput()
    expect(output).toContain('empty resultset received')
    expect(output).not.toContain('request-id')
  })

  it('reports the request id when the item is missing from the resultset', async () => {
    await loadContentByPath(mockClient('req-noitem'), (async () => ({ content: { total: 1, items: [] } })) as never, '/missing/')
    expect(errorOutput()).toContain('[request-id: req-noitem]')
  })
})

describe('CmsPage', () => {
  it('reports the request id of the latest Graph request when the content cannot be resolved', async () => {
    const page = createPage({} as never, {
      client: (() => mockClient('req-page')) as never,
      getContentByPath: (async () => ({ content: { total: 0 } })) as never
    })
    const result = await page.CmsPage({ params: Promise.resolve({ path: ['missing'] }), searchParams: Promise.resolve({}) })
    expect(result).toBe('not-found')
    expect(errorOutput()).toMatch(/Unable to resolve the content for .*\[request-id: req-page\]/)
  })
})
