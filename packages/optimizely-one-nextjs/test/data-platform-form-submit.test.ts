import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// The package is only importable from a server context, which Vitest doesn't provide
vi.mock('server-only', () => ({}))

import DataPlatform, { submitForm } from '../src/products/data-platform/server-index'
import { DataPlatformClient, DataPlatformError, type DataPlatformCookies } from '../src/products/data-platform/api'

const PUBLIC_KEY = 'publickey1234'
const PRIVATE_KEY = `${PUBLIC_KEY}.privatesecret5678`
const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../src')

type FetchCall = { url: string, init: RequestInit & { headers: Record<string, string> }, body: Array<Record<string, Record<string, string>>> }

/** Create request cookies that hold the supplied values */
function cookiesOf(values: Record<string, string>): DataPlatformCookies {
  return { get: (name: string) => name in values ? { name, value: values[name] } : undefined } as unknown as DataPlatformCookies
}

const visitorCookies = cookiesOf({ vuid: 'aaaa-bbbb-cccc|extra', visitorId: 'frontend-user', iv: 'ci-visitor' })
const visitorIdentifiers = { vuid: 'aaaabbbbcccc', fs_user_id: 'frontend-user', content_intelligence_id: 'ci-visitor' }

let fetchMock: MockInstance
let stdout: Array<MockInstance>
let stderr: Array<MockInstance>

/** The requests sent to ODP, with the parsed body */
function fetchCalls(): Array<FetchCall> {
  return fetchMock.mock.calls.map(([url, init]) => ({ url: String(url), init, body: JSON.parse(init.body) }))
}

function respondWith(...responses: Array<Response>) {
  responses.forEach(response => fetchMock.mockResolvedValueOnce(response))
}

const submission = {
  email: 'visitor@example.com',
  fields: { first_name: 'Vera' },
  event: { type: 'form', action: 'submit', data: { form_id: 'contact', form_name: 'Contact', page: '/contact', hostname: 'example.com' } }
}

beforeEach(() => {
  vi.stubEnv('OPTIMIZELY_DATAPLATFORM_ID', PRIVATE_KEY)
  vi.stubEnv('OPTIMIZELY_DATAPLATFORM_ENDPOINT', 'https://odp.example.com/')
  fetchMock = vi.fn().mockImplementation(async () => new Response('{}', { status: 202 }))
  vi.stubGlobal('fetch', fetchMock)
  // Keeps the output clean, and allows asserting on the log output
  stdout = ['log', 'info', 'debug', 'group', 'groupCollapsed'].map(method => vi.spyOn(console, method as 'log').mockImplementation(() => undefined))
  stdout.push(vi.spyOn(process.stdout, 'write').mockImplementation(() => true))
  stderr = ['warn', 'error', 'trace'].map(method => vi.spyOn(console, method as 'warn').mockImplementation(() => undefined))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

function logged() {
  return [...stdout, ...stderr].flatMap(spy => spy.mock.calls.map(call => call.join(' ')))
}

describe('server action form submission', () => {
  it('posts a form to ODP using only the package APIs', async () => {
    await expect(DataPlatform.submitForm(visitorCookies, submission)).resolves.toBeUndefined()

    const calls = fetchCalls()
    expect(calls.map(call => call.url)).toEqual(['https://odp.example.com/v3/profiles', 'https://odp.example.com/v3/events'])
    calls.forEach(call => {
      expect(call.init.method).toBe('POST')
      expect(call.init.headers['x-api-key']).toBe(PRIVATE_KEY)
      expect(call.init.headers['content-type']).toBe('application/json')
    })
  })

  it('exposes submitForm on both the named and default export', () => {
    expect(DataPlatform.submitForm).toBe(submitForm)
    expect(typeof DataPlatform.Client).toBe('function')
  })
})

describe('visitor identifiers', () => {
  it('adds the VUID to both the profile upsert and the event identifiers', async () => {
    await submitForm(visitorCookies, submission)

    const [profile, event] = fetchCalls()
    expect(profile.body[0].attributes).toMatchObject({ ...visitorIdentifiers, email: 'visitor@example.com', first_name: 'Vera' })
    expect(event.body[0].identifiers).toMatchObject({ ...visitorIdentifiers, email: 'visitor@example.com' })
  })

  it('lets the visitor cookies take precedence over identifiers supplied by the caller', async () => {
    await submitForm(visitorCookies, { ...submission, fields: { vuid: 'spoofed' }, event: { ...submission.event, identifiers: { vuid: 'spoofed' } } })

    const [profile, event] = fetchCalls()
    expect(profile.body[0].attributes.vuid).toBe('aaaabbbbcccc')
    expect(event.body[0].identifiers.vuid).toBe('aaaabbbbcccc')
  })

  it('only sends the identifiers that are present and warns about the missing ones', async () => {
    await submitForm(cookiesOf({ vuid: 'aaaa-bbbb' }), submission)

    const [profile, event] = fetchCalls()
    expect(profile.body[0].attributes).toEqual({ first_name: 'Vera', email: 'visitor@example.com', vuid: 'aaaabbbb' })
    expect(event.body[0].identifiers).toEqual({ email: 'visitor@example.com', vuid: 'aaaabbbb' })
    expect(profile.body[0].attributes).not.toHaveProperty('fs_user_id')
    expect(logged().filter(line => line.includes('fs_user_id are missing') || line.includes('for fs_user_id'))).toHaveLength(2)
  })

  it('writes by email alone when the cookies hold no identifiers, and warns', async () => {
    await submitForm(cookiesOf({}), submission)

    const [profile, event] = fetchCalls()
    expect(profile.body[0].attributes).toEqual({ first_name: 'Vera', email: 'visitor@example.com' })
    expect(event.body[0].identifiers).toEqual({ email: 'visitor@example.com' })
    expect(logged().filter(line => line.includes('vuid and fs_user_id'))).toHaveLength(2)
  })

  it('rejects a write without any identifier before calling ODP', async () => {
    const client = new DataPlatformClient()

    await expect(client.upsertProfile({ first_name: 'Vera' }, cookiesOf({}))).rejects.toBeInstanceOf(DataPlatformError)
    await expect(client.sendEvent({ type: 'form' }, cookiesOf({}))).rejects.toBeInstanceOf(DataPlatformError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('profile and event order', () => {
  it('upserts the profile first, then sends the form submit event with its data', async () => {
    const order: Array<string> = []
    fetchMock.mockImplementation(async (url: URL) => {
      order.push(url.pathname)
      // The event may only be sent after the profile upsert has completed
      if (url.pathname == '/v3/profiles')
        await new Promise(resolve => setTimeout(resolve, 10))
      order.push(`${url.pathname} done`)
      return new Response('{}', { status: 202 })
    })

    await submitForm(visitorCookies, submission)

    expect(order).toEqual(['/v3/profiles', '/v3/profiles done', '/v3/events', '/v3/events done'])
    const [, event] = fetchCalls()
    expect(event.body).toHaveLength(1)
    expect(event.body[0]).toMatchObject({
      type: 'form',
      action: 'submit',
      data: { form_id: 'contact', form_name: 'Contact', page: '/contact', hostname: 'example.com' }
    })
  })

  it('does not send the event when the profile upsert fails', async () => {
    respondWith(new Response('{}', { status: 500, statusText: 'Server Error' }))

    await expect(submitForm(visitorCookies, submission)).rejects.toBeInstanceOf(DataPlatformError)
    expect(fetchCalls().map(call => new URL(call.url).pathname)).toEqual(['/v3/profiles'])
  })
})

describe('when ODP is not available for writes', () => {
  /** The console methods that write to stdout, which are only used for debug output */
  const debugOutput = () => stdout.flatMap(spy => spy.mock.calls)
  const warnings = () => stderr[0].mock.calls

  it('skips safely, with a debug log, when ODP is disabled', async () => {
    vi.stubEnv('OPTIMIZELY_DATAPLATFORM_ID', '')
    vi.stubEnv('OPTIMIZELY_DEBUG', '1')

    await expect(submitForm(visitorCookies, submission)).resolves.toBeUndefined()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(logged().some(line => line.includes('Optimizely Data Platform'))).toBe(true)
    expect(debugOutput()).toHaveLength(1)
    expect(warnings()).toHaveLength(0)
  })

  it('skips safely, with a debug log, when only a public key is configured', async () => {
    vi.stubEnv('OPTIMIZELY_DATAPLATFORM_ID', PUBLIC_KEY)
    vi.stubEnv('OPTIMIZELY_DEBUG', '1')

    await expect(submitForm(visitorCookies, submission)).resolves.toBeUndefined()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(logged().some(line => line.includes('Optimizely Data Platform'))).toBe(true)
    expect(warnings()).toHaveLength(1)
    expect(debugOutput()).toHaveLength(0)
  })

  it('only logs the skip of a disabled ODP when debug output is enabled', async () => {
    vi.stubEnv('OPTIMIZELY_DATAPLATFORM_ID', '')

    await expect(submitForm(visitorCookies, submission)).resolves.toBeUndefined()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(logged()).toEqual([])
  })

  it('always warns about the skip when only a public key is configured', async () => {
    vi.stubEnv('OPTIMIZELY_DATAPLATFORM_ID', PUBLIC_KEY)

    await expect(submitForm(visitorCookies, submission)).resolves.toBeUndefined()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(debugOutput()).toHaveLength(0)
    expect(warnings()).toHaveLength(1)
    expect(String(warnings()[0][0])).toContain('private key')
    expect(String(warnings()[0][0])).not.toContain(PUBLIC_KEY)
  })

  it('keeps throwing from the low-level write methods without a private key', async () => {
    vi.stubEnv('OPTIMIZELY_DATAPLATFORM_ID', PUBLIC_KEY)
    const client = new DataPlatformClient()

    await expect(client.upsertProfile({ email: 'visitor@example.com' }, visitorCookies)).rejects.toBeInstanceOf(DataPlatformError)
    await expect(client.sendEvent({ type: 'form' }, visitorCookies)).rejects.toBeInstanceOf(DataPlatformError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('failures', () => {
  it('raises a DataPlatformError with the status of a failed profile upsert', async () => {
    respondWith(new Response('{"title":"Bad Request"}', { status: 400, statusText: 'Bad Request' }))

    const error = await submitForm(visitorCookies, submission).catch(e => e)

    expect(error).toBeInstanceOf(DataPlatformError)
    expect(error.message).toContain('/v3/profiles')
    expect(error.message).toContain('400')
    expect(error.trackerId).toBe(PUBLIC_KEY)
  })

  it('raises a DataPlatformError with the status of a failed event', async () => {
    respondWith(new Response('{}', { status: 202 }), new Response('{}', { status: 503, statusText: 'Service Unavailable' }))

    const error = await submitForm(visitorCookies, submission).catch(e => e)

    expect(error).toBeInstanceOf(DataPlatformError)
    expect(error.message).toContain('/v3/events')
    expect(error.message).toContain('503')
  })

  it('includes the status and response detail of ODP in the error, but not in the message', async () => {
    respondWith(new Response('{"title":"Bad Request","detail":"Invalid attribute first_name"}', { status: 400, statusText: 'Bad Request' }))

    const error = await submitForm(visitorCookies, submission).catch(e => e)

    expect(error).toBeInstanceOf(DataPlatformError)
    expect(error.status).toBe(400)
    expect(error.detail).toContain('Invalid attribute first_name')
    expect(error.message).not.toContain('Invalid attribute first_name')
  })

  it('has no status or detail when ODP returned no body, or when the error is not from a response', async () => {
    respondWith(new Response(null, { status: 500, statusText: 'Server Error' }))

    const error = await submitForm(visitorCookies, submission).catch(e => e)

    expect(error.status).toBe(500)
    expect(error.detail).toBeUndefined()
    expect(new DataPlatformError('message').status).toBeUndefined()
    expect(new DataPlatformError('message').detail).toBeUndefined()
  })

  it('caps the detail at 500 characters and collapses control characters', async () => {
    respondWith(new Response(`line one\r\n\u0000line two ${'x'.repeat(2000)}`, { status: 400, statusText: 'Bad Request' }))

    const error = await submitForm(visitorCookies, submission).catch(e => e)

    expect(error.detail).toHaveLength(500)
    expect(error.detail).toMatch(/^line one line two x+$/)
  })

  it('redacts the submitted values and the private key from the detail', async () => {
    const echoed = `Invalid email visitor@example.com for Vera (vuid aaaabbbbcccc) using key ${PRIVATE_KEY} and secret privatesecret5678; field first_name`
    respondWith(new Response(echoed, { status: 422, statusText: 'Unprocessable Entity' }))

    const error = await submitForm(visitorCookies, submission).catch(e => e)

    expect(error.detail).toBe('Invalid email [redacted] for [redacted] (vuid [redacted]) using key [redacted] and secret [redacted]; field first_name')
    expect(`${error.message} ${error.trackerId} ${error.detail}`).not.toContain('privatesecret5678')
  })

  it('has no detail when the response body cannot be read', async () => {
    const response = new Response('body', { status: 500, statusText: 'Server Error' })
    vi.spyOn(response, 'text').mockRejectedValue(new Error('stream failed'))
    respondWith(response)

    const error = await submitForm(visitorCookies, submission).catch(e => e)

    expect(error.status).toBe(500)
    expect(error.detail).toBeUndefined()
  })
})

describe('private key boundary', () => {
  /** The local (relative) modules that are imported by a source file */
  function localImports(file: string): Array<string> {
    const source = readFileSync(file, 'utf8')
    const specifiers = [...source.matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g)].map(match => match[1])
    return specifiers.map(specifier => {
      const base = resolve(dirname(file), specifier.replace(/\.js$/, ''))
      return [`${base}.ts`, `${base}.tsx`, resolve(base, 'index.ts')].find(candidate => {
        try { readFileSync(candidate); return true } catch { return false }
      })
    }).filter((candidate): candidate is string => candidate != undefined)
  }

  /** All source files that are reachable from an entry point */
  function reachableFrom(entry: string): Set<string> {
    const seen = new Set<string>()
    const pending = [entry]
    while (pending.length > 0) {
      const file = pending.pop() as string
      if (seen.has(file)) continue
      seen.add(file)
      pending.push(...localImports(file))
    }
    return seen
  }

  it('keeps the write helper out of the client and shared entry points', () => {
    for (const entry of ['client.ts', 'api.ts', 'proxy-entry.ts'])
      expect([...reachableFrom(resolve(SRC, entry))].filter(file => file.endsWith('submit-form.ts') || file.endsWith('server-index.ts'))).toEqual([])
  })

  it('marks the entry points that expose the write helper as server-only', () => {
    for (const file of ['products/data-platform/submit-form.ts', 'server.ts'])
      expect(readFileSync(resolve(SRC, file), 'utf8')).toMatch(/^import 'server-only'/)
  })

  it('does not leak the private key through the tracker id or the error', async () => {
    const client = new DataPlatformClient()
    expect(client.trackerId).toBe(PUBLIC_KEY)

    respondWith(new Response('{}', { status: 500, statusText: 'Server Error' }))
    const error = await submitForm(visitorCookies, submission).catch(e => e)
    expect(`${error.message} ${error.trackerId}`).not.toContain('privatesecret5678')
  })

  it('does not read the private key from a public (NEXT_PUBLIC) environment variable', () => {
    const sources = ['config.ts', 'env-vars.ts'].map(file => readFileSync(resolve(SRC, file), 'utf8')).join('\n')
    expect(sources).not.toContain('NEXT_PUBLIC_')
  })
})
