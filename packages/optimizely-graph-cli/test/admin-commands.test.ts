import { stripVTControlCharacters } from 'node:util'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCliApp } from '../src/app'
import listWebhooksModule from '../src/commands/list'
import unpublishModule from '../src/commands/unpublish'
import publishModule from '../src/commands/publish'
import { GraphSourceListCommand as sourceListModule } from '../src/commands/sources/list'
import { GraphSourceClearCommand as sourceClearModule } from '../src/commands/sources/clear'
import { GraphSourceRemoveCommand as sourceRemoveModule } from '../src/commands/sources/remove'

/**
 * Characterization of the commands that use the Optimizely Graph Admin API. A stubbed
 * fetch plays the part of Optimizely Graph, so these tests pin the requests that each
 * command sends and its output and exit code, independent of the client implementation.
 */

const ENV_KEYS = [
  'OPTIMIZELY_PUBLISH_TOKEN', 'OPTIMIZELY_PUBLISH_HEADER', 'FRONTEND_PUBLISH_TOKEN',
  'OPTIMIZELY_GRAPH_APP_KEY', 'OPTIMIZELY_GRAPH_SECRET', 'OPTIMIZELY_GRAPH_SINGLE_KEY', 'OPTIMIZELY_GRAPH_GATEWAY',
  'SITE_DOMAIN', 'SITE_PRIMARY'
]

type Call = { method: string, path: string, query: URLSearchParams, body: string, authorization: string | null }
type Reply = { status?: number, json?: unknown }

let calls: Call[]
let stdout: string[]
let stderr: string[]
let respond: (call: Call) => Reply
let previousEnv: Record<string, string | undefined>
let previousExitCode: typeof process.exitCode

const stripAnsi = (text: string) => stripVTControlCharacters(text)

beforeEach(() => {
  previousEnv = {}
  ENV_KEYS.forEach(key => {
    previousEnv[key] = process.env[key]
    delete process.env[key]
  })
  process.env.OPTIMIZELY_GRAPH_APP_KEY = 'app-key'
  process.env.OPTIMIZELY_GRAPH_SECRET = 'c2VjcmV0'
  process.env.OPTIMIZELY_GRAPH_SINGLE_KEY = 'single'
  process.env.OPTIMIZELY_GRAPH_GATEWAY = 'https://graph.example.com'
  process.env.SITE_DOMAIN = 'site.example.com'
  previousExitCode = process.exitCode
  process.exitCode = undefined

  calls = []
  stdout = []
  stderr = []
  respond = () => ({ status: 404 })
  vi.stubGlobal('fetch', async (input: Request | string, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init)
    const url = new URL(request.url)
    const call: Call = {
      method: request.method,
      path: url.pathname,
      query: url.searchParams,
      body: await request.clone().text(),
      authorization: request.headers.get('authorization')
    }
    calls.push(call)
    const reply = respond(call)
    if (reply.status == 204)
      return new Response(null, { status: 204 })
    return new Response(reply.json === undefined ? null : JSON.stringify(reply.json), {
      status: reply.status ?? 200,
      statusText: reply.status == 404 ? 'Not Found' : reply.status == 500 ? 'Internal Server Error' : 'OK',
      headers: { 'content-type': 'application/json' }
    })
  })
  const capture = (target: string[]) => (...args: unknown[]) => { target.push(stripAnsi(args.map(String).join(' '))) }
  vi.spyOn(console, 'log').mockImplementation(capture(stdout))
  vi.spyOn(console, 'error').mockImplementation(capture(stderr))
  vi.spyOn(console, 'warn').mockImplementation(capture(stderr))
  vi.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => { stdout.push(stripAnsi(String(chunk))); return true })
  vi.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => { stderr.push(stripAnsi(String(chunk))); return true })
  vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  process.exitCode = previousExitCode
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined)
      delete process.env[key]
    else
      process.env[key] = value
  }
})

async function run(module: unknown, argv: string[]) {
  await createCliApp('test-cli', '0.0.0').exitProcess(false).command(module as never).parse(argv)
}

const out = () => stdout.join('')
const err = () => stderr.join('')
const SOURCE = { id: 'src1', label: 'Source One', languages: ['en', 'nl'] }

describe('webhook:list', () => {
  it('lists the registered webhooks, signed with the HMAC credentials', async () => {
    respond = () => ({ json: [{ id: 'hook-1', request: { url: 'https://site.example.com/api/content/publish', method: 'POST' } }] })
    await run(listWebhooksModule, ['webhook:list'])
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/api/webhooks' })
    expect(calls[0].authorization).toMatch(/^epi-hmac app-key:/)
    expect(out()).toContain('hook-1')
    expect(out()).toContain('https://site.example.com/api/content/publish')
    expect(out()).toContain('Done')
    expect(process.exitCode).toBeUndefined()
  })

  it('reports an API error with exit code 1', async () => {
    respond = () => ({ status: 500, json: { message: 'boom' } })
    await run(listWebhooksModule, ['webhook:list'])
    expect(err()).toContain('HTTP 500: Internal Server Error')
    expect(process.exitCode).toBe(1)
  })
})

describe('webhook:delete --token_id', () => {
  const id = 'a'.repeat(30)

  it('removes the webhook with that id', async () => {
    respond = () => ({ status: 204 })
    await run(unpublishModule, ['webhook:delete', '--publish_token', 'x', '--token_id', id])
    expect(calls.map(c => `${c.method} ${c.path}`)).toEqual([`DELETE /api/webhooks/${id}`])
    expect(out()).toContain(`Removed WebHook with ID ${id}`)
    expect(process.exitCode).toBeUndefined()
  })

  it('reports an API error with exit code 1', async () => {
    respond = () => ({ status: 404 })
    await run(unpublishModule, ['webhook:delete', '--publish_token', 'x', '--token_id', id])
    expect(err()).toContain('HTTP 404')
    expect(process.exitCode).toBe(1)
  })
})

describe('webhook:create', () => {
  it('refuses to register a localhost site', async () => {
    delete process.env.SITE_DOMAIN
    await run(publishModule, ['webhook:create', '--publish_token', 'secret-token'])
    expect(calls).toHaveLength(0)
    expect(err()).toContain('localhost')
    expect(process.exitCode).toBe(1)
  })

  it('reports an API error with exit code 1', async () => {
    respond = () => ({ status: 500, json: { message: 'boom' } })
    await run(publishModule, ['webhook:create', '--publish_token', 'secret-token'])
    expect(err()).toContain('HTTP 500: Internal Server Error')
    expect(process.exitCode).toBe(1)
  })
})

describe('source:list', () => {
  it('lists the content sources', async () => {
    respond = () => ({ json: [SOURCE] })
    await run(sourceListModule, ['source:list'])
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/api/content/v3/sources' })
    expect(out()).toContain('src1')
    expect(out()).toContain('Source One')
    expect(out()).toContain('en, nl')
    expect(process.exitCode).toBeUndefined()
  })

  it('reports an API error with exit code 1', async () => {
    respond = () => ({ status: 500 })
    await run(sourceListModule, ['source:list'])
    expect(err()).toContain('HTTP 500')
    expect(process.exitCode).toBe(1)
  })
})

describe('source:clear', () => {
  it('loads the source and removes its data for all of its languages', async () => {
    respond = call => call.method == 'GET' ? { json: [SOURCE] } : { status: 204 }
    await run(sourceClearModule, ['source:clear', 'src1'])
    expect(calls.map(c => `${c.method} ${c.path}`)).toEqual(['GET /api/content/v3/sources', 'DELETE /api/content/v2/data'])
    expect(calls[0].query.getAll('id')).toEqual(['src1'])
    expect(calls[1].query.getAll('id')).toEqual(['src1'])
    expect(calls[1].query.getAll('languages')).toEqual(['en', 'nl'])
    expect(out()).toContain('Done')
    expect(process.exitCode).toBeUndefined()
  })

  it('reports an unknown source (404)', async () => {
    respond = () => ({ status: 404 })
    await run(sourceClearModule, ['source:clear', 'nope'])
    expect(err()).toContain('Source with ID nope does not exist')
    expect(process.exitCode).toBe(1)
  })

  it('rejects a source that Graph returned for a different id', async () => {
    respond = () => ({ json: [{ ...SOURCE, id: 'other' }] })
    await run(sourceClearModule, ['source:clear', 'src1'])
    expect(calls.filter(c => c.method == 'DELETE')).toHaveLength(0)
    expect(process.exitCode).toBe(1)
  })
})

describe('source:delete', () => {
  it('removes the data and then the source itself', async () => {
    respond = call => call.method == 'GET' ? { json: [SOURCE] } : { status: 204 }
    await run(sourceRemoveModule, ['source:delete', 'src1'])
    expect(calls.map(c => `${c.method} ${c.path}`)).toEqual([
      'GET /api/content/v3/sources',
      'DELETE /api/content/v2/data',
      'DELETE /api/content/v3/sources'
    ])
    expect(calls[2].query.getAll('id')).toEqual(['src1'])
    expect(out()).toContain('Done')
    expect(process.exitCode).toBeUndefined()
  })

  it('reports an unknown source (404)', async () => {
    respond = () => ({ status: 404 })
    await run(sourceRemoveModule, ['source:delete', 'nope'])
    expect(err()).toContain('Source with ID nope does not exist')
    expect(process.exitCode).toBe(1)
  })
})

describe('webhook registration with the publish token in a header', () => {
  const TOKEN = 'registration-secret-0123456789'
  const TARGET = 'https://site.example.com/api/content/publish'
  const created = () => calls.filter(c => c.method == 'POST')
  const deleted = () => calls.filter(c => c.method == 'DELETE').map(c => c.path.split('/').pop())
  const everything = () => out() + err()
  const reply = (hooks: unknown[]) => (call: Call): Reply => call.method == 'GET' ? { json: hooks } : call.method == 'POST' ? { status: 201, json: { id: 'new-hook' } } : { status: 204 }

  it('registers the token as header X-OPTLY-PUBLISH, with a URL without a token', async () => {
    respond = reply([])
    await run(publishModule, ['webhook:create', '--publish_token', TOKEN])
    expect(created()).toHaveLength(1)
    expect(JSON.parse(created()[0].body)).toEqual({ request: { url: TARGET, method: 'POST', headers: { 'X-OPTLY-PUBLISH': TOKEN } } })
    expect(everything()).not.toContain(TOKEN)
    expect(process.exitCode).toBeUndefined()
  })

  it('uses the header configured in OPTIMIZELY_PUBLISH_HEADER', async () => {
    process.env.OPTIMIZELY_PUBLISH_HEADER = 'x-optimizely-graph-publish'
    respond = reply([])
    await run(publishModule, ['webhook:create', '--publish_token', TOKEN])
    expect(JSON.parse(created()[0].body).request.headers).toEqual({ 'x-optimizely-graph-publish': TOKEN })
  })

  it('resolves ${VERCEL_AUTOMATION_BYPASS_SECRET} as the publish token', async () => {
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET = 'bypass-secret-value'
    process.env.OPTIMIZELY_PUBLISH_TOKEN = '${VERCEL_AUTOMATION_BYPASS_SECRET}'
    process.env.OPTIMIZELY_PUBLISH_HEADER = 'x-vercel-protection-bypass'
    respond = reply([])
    try {
      await run(publishModule, ['webhook:create'])
    } finally {
      delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    }
    expect(JSON.parse(created()[0].body).request.headers).toEqual({ 'x-vercel-protection-bypass': 'bypass-secret-value' })
    expect(everything()).not.toContain('bypass-secret-value')
  })

  it('does not register anything when the publish token cannot be resolved', async () => {
    process.env.OPTIMIZELY_PUBLISH_TOKEN = '${THIS_VARIABLE_IS_NOT_SET}'
    respond = reply([])
    await run(publishModule, ['webhook:create'])
    expect(created()).toHaveLength(0)
    expect(err()).toContain('OPTIMIZELY_PUBLISH_TOKEN refers to an environment variable that is not set')
    expect(err()).toContain('publish_token')
  })

  it('does nothing when an identical webhook is already registered', async () => {
    respond = reply([{ id: 'h1', request: { url: TARGET, method: 'POST', headers: { 'X-OPTLY-PUBLISH': TOKEN } } }])
    await run(publishModule, ['webhook:create', '--publish_token', TOKEN])
    expect(created()).toHaveLength(0)
    expect(deleted()).toEqual([])
    expect(out()).toContain('already registered')
  })

  it('replaces a webhook that does not (verifiably) send the token header', async () => {
    respond = reply([{ id: 'h1', request: { url: TARGET, method: 'POST' } }])
    await run(publishModule, ['webhook:create', '--publish_token', TOKEN])
    expect(deleted()).toEqual(['h1'])
    expect(created()).toHaveLength(1)
  })

  it('removes legacy webhooks that carry the token in the URL, and leaves other paths alone', async () => {
    respond = reply([
      { id: 'legacy', request: { url: `${TARGET}?token=oldsecret`, method: 'POST' } },
      { id: 'other', request: { url: 'https://site.example.com/api/other?token=x', method: 'POST' } }
    ])
    await run(publishModule, ['webhook:create', '--publish_token', TOKEN])
    expect(deleted()).toEqual(['legacy'])
    expect(created()).toHaveLength(1)
    expect(everything()).not.toContain('oldsecret')
    expect(out()).toMatch(/Removing webhook[^\n]*\n/)
  })

  it('lists webhooks without exposing a token in the URL or the header values', async () => {
    respond = reply([
      { id: 'legacy', request: { url: `${TARGET}?token=legacysecret`, method: 'POST' } },
      { id: 'modern', request: { url: TARGET, method: 'POST', headers: { 'X-OPTLY-PUBLISH': 'headersecret' } } }
    ])
    await run(listWebhooksModule, ['webhook:list'])
    expect(out()).toContain('legacy')
    expect(out()).toContain('modern')
    expect(everything()).not.toContain('legacysecret')
    expect(everything()).not.toContain('headersecret')
  })

  it('removes webhooks by path, whether they use a token in the URL or a header', async () => {
    respond = reply([
      { id: 'legacy', request: { url: `${TARGET}?token=oldsecret`, method: 'POST' } },
      { id: 'modern', request: { url: TARGET, method: 'POST', headers: { 'X-OPTLY-PUBLISH': TOKEN } } },
      { id: 'other', request: { url: 'https://site.example.com/api/other', method: 'POST' } }
    ])
    await run(unpublishModule, ['webhook:delete', '--publish_token', TOKEN])
    expect(deleted().sort()).toEqual(['legacy', 'modern'])
    expect(everything()).not.toContain('oldsecret')
    expect(everything()).not.toContain(TOKEN)
  })
})

describe('webhook:delete without a publish token', () => {
  const TARGET = 'https://site.example.com/api/content/publish'
  const deleted = () => calls.filter(c => c.method == 'DELETE').map(c => c.path.split('/').pop())

  it('removes the webhooks on the path without requiring --publish_token', async () => {
    respond = call => call.method == 'GET'
      ? { json: [{ id: 'modern', request: { url: TARGET, method: 'POST', headers: { 'X-OPTLY-PUBLISH': 'some-secret' } } }] }
      : { status: 204 }
    await run(unpublishModule, ['webhook:delete', '/api/content/publish'])
    expect(err()).not.toContain('Missing required argument')
    expect(deleted()).toEqual(['modern'])
    expect(process.exitCode).toBeUndefined()
  })

  it('documents that --publish_token is optional and ignored', async () => {
    await run(unpublishModule, ['webhook:delete', '--help'])
    expect(out()).toContain('--publish_token')
    expect(out()).toMatch(/deprecated/i)
    expect(out()).not.toContain('[required]')
  })
})
