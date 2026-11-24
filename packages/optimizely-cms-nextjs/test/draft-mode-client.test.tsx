import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { NextRequest } from 'next/server.js'
import { AuthMode } from '@remkoj/optimizely-graph-client'

vi.mock('server-only', () => ({}))
vi.mock('next/script.js', () => ({ default: () => null }))
vi.mock('next/navigation.js', () => ({ notFound: () => 'not-found' }))
vi.mock('next/cache.js', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('../src/ope/load-content.js', () => ({
  default: vi.fn(async () => ({ contentLink: { key: 'abcdef', locale: 'en' }, contentItem: {}, contentType: ['Page'] }))
}))

const draftModeState = vi.hoisted(() => ({ isEnabled: false }))
const nextHeaders = vi.hoisted(() => ({
  draftMode: vi.fn(async () => draftModeState),
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({ get: () => undefined }))
}))
vi.mock('next/headers.js', () => nextHeaders)
vi.mock('next/headers', () => nextHeaders)

import { createNextJsClient, createClient, createAuthorizedClient, getServerClient, resolveClient, isClientFactory } from '../src/client.js'
import { createPage } from '../src/cms-page/page.js'
import { createLayout } from '../src/cms-page/layout.js'
import { createPublishApi } from '../src/publish/index.js'
import { createEditPageComponent } from '../src/ope/page.js'
import { logger } from '../src/logger.js'

const config = {
  app_key: 'app',
  secret: 'secret',
  single_key: 'single',
  gateway: 'https://example.com',
  publish: 'publish-token'
} as never

let stdout: Array<MockInstance>
let warn: MockInstance

const longToken = 'a-long-enough-token-'.repeat(4)

beforeEach(() => {
  vi.stubEnv('OPTIMIZELY_GRAPH_APP_KEY', 'app')
  vi.stubEnv('OPTIMIZELY_GRAPH_SECRET', 'secret')
  vi.stubEnv('OPTIMIZELY_GRAPH_SINGLE_KEY', 'single')
  vi.stubEnv('OPTIMIZELY_GRAPH_GATEWAY', 'https://example.com')
  draftModeState.isEnabled = false
  nextHeaders.draftMode.mockClear()
  nextHeaders.headers.mockClear()
  nextHeaders.cookies.mockClear()
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
  warn = stderr[0]
  ;[...stdout, ...stderr].forEach(spy => spy.mockImplementation(() => true))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

function expectNoRequestApiAccess() {
  expect(nextHeaders.draftMode).not.toHaveBeenCalled()
  expect(nextHeaders.headers).not.toHaveBeenCalled()
  expect(nextHeaders.cookies).not.toHaveBeenCalled()
}

type Client = Awaited<ReturnType<typeof createNextJsClient>>

/** Run every path of a page created with the given options, returning the client each path received */
async function runPage(options: Parameters<typeof createPage>[1] = {}) {
  const clients: Record<'staticParams' | 'metadata' | 'render', Client | undefined> = {
    staticParams: undefined,
    metadata: undefined,
    render: undefined
  }
  let current: keyof typeof clients = 'staticParams'
  const page = createPage({} as never, {
    routerFactory: ((client: Client) => {
      clients[current] = client
      return { getRoutes: async () => [], getContentInfoByPath: async () => undefined }
    }) as never,
    ...options
  })
  const props = { params: Promise.resolve({ path: ['a'] }), searchParams: Promise.resolve({}) } as never
  current = 'staticParams'
  await page.generateStaticParams()
  current = 'metadata'
  await page.generateMetadata(props, Promise.resolve({}) as never)
  current = 'render'
  await page.CmsPage(props)
  return clients
}

async function runLayout(options: Parameters<typeof createLayout>[0] = {}) {
  let received: Client | undefined
  const layout = createLayout({
    getMetaDataByPath: (async (client: Client) => {
      received = client
      return {}
    }) as never,
    ...options
  })
  await layout.generateMetadata({ params: Promise.resolve({ path: ['a'] }) } as never, Promise.resolve({}) as never)
  return received
}

describe('createNextJsClient', () => {
  it('serves published content with the Public client when Draft Mode is off', async () => {
    const client = await createNextJsClient()
    expect(nextHeaders.draftMode).toHaveBeenCalledTimes(1)
    expect(client.currentAuthMode).toBe(AuthMode.Public)
    expect(client.isPreviewEnabled()).toBe(false)
  })

  it('switches to HMAC and enables preview when Draft Mode is on', async () => {
    draftModeState.isEnabled = true
    const client = await createNextJsClient()
    expect(client.currentAuthMode).toBe(AuthMode.HMAC)
    expect(client.isPreviewEnabled()).toBe(true)
    expect(nextHeaders.headers).not.toHaveBeenCalled()
    expect(nextHeaders.cookies).not.toHaveBeenCalled()
  })

  it.each([
    ['the metadata scope shorthand', 'metadata'],
    ['the metadata scope in the configuration', { ...(config as object), scope: 'metadata' }],
    ['disableDraftMode', { ...(config as object), disableDraftMode: true }]
  ] as const)('does not read Draft Mode for %s, even when it is on', async (_name, configOrScope) => {
    draftModeState.isEnabled = true
    const client = await createNextJsClient(undefined, configOrScope as never)
    expectNoRequestApiAccess()
    expect(client.currentAuthMode).toBe(AuthMode.Public)
    expect(client.isPreviewEnabled()).toBe(false)
  })

  it('leaves an authorized client unchanged when Draft Mode is on', async () => {
    draftModeState.isEnabled = true
    const client = await createNextJsClient(longToken)
    expect(client.currentAuthMode).toBe(AuthMode.Token)
    expect(client.isPreviewEnabled()).toBe(false)
  })

  it('applies a token without Draft Mode', async () => {
    const client = await createNextJsClient(longToken)
    expect(client.currentAuthMode).toBe(AuthMode.Token)
  })

  it('stays silent on stdout in production while switching to drafts and reports it as a warning', async () => {
    draftModeState.isEnabled = true
    await createNextJsClient()
    expect(stdout.reduce((total, spy) => total + spy.mock.calls.length, 0)).toBe(0)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Switching to common drafts'))
  })

  it('reports ignoring Draft Mode for an authorized client as a warning', async () => {
    draftModeState.isEnabled = true
    await createNextJsClient(longToken)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('DraftMode ignored'))
  })

  it('reports authentication by the publish token as a warning, only in development or debug', async () => {
    const publishConfig = { ...(config as object), publish: longToken, scope: 'metadata' } as never
    await createNextJsClient(longToken, publishConfig)
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('publish token'))
    vi.stubEnv('NODE_ENV', 'development')
    await createNextJsClient(longToken, publishConfig)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('publish token'))
  })

  it('has deprecated aliases that apply Draft Mode and are asynchronous', async () => {
    draftModeState.isEnabled = true
    for (const factory of [createClient, createAuthorizedClient, getServerClient]) {
      const result = factory()
      expect(result).toBeInstanceOf(Promise)
      expect((await result).currentAuthMode).toBe(AuthMode.HMAC)
    }
  })
})

describe('resolveClient', () => {
  const metadataConfig = { ...(config as object), scope: 'metadata' }

  it('returns an existing client unchanged, without reading request data', async () => {
    draftModeState.isEnabled = true
    const instance = await createNextJsClient(undefined, 'metadata')
    expect(await resolveClient(instance, undefined, 'request')).toBe(instance)
    expectNoRequestApiAccess()
  })

  it('creates a client from a configuration, honouring the scope in it and ignoring the third argument', async () => {
    draftModeState.isEnabled = true
    const client = await resolveClient(metadataConfig as never, undefined, 'request')
    expectNoRequestApiAccess()
    expect(client.currentAuthMode).toBe(AuthMode.Public)
    expect(client.isPreviewEnabled()).toBe(false)
  })

  it('creates a draft-aware client from a configuration without a scope', async () => {
    draftModeState.isEnabled = true
    const client = await resolveClient(config as never)
    expect(client.currentAuthMode).toBe(AuthMode.HMAC)
    expect(client.isPreviewEnabled()).toBe(true)
  })

  it('passes the token and scope or configuration to a (async) factory and returns its client', async () => {
    const custom = await createNextJsClient(undefined, 'metadata')
    const sync = vi.fn(() => custom)
    const asynchronous = vi.fn(async () => custom)
    expect(await resolveClient(sync, 'token', 'metadata')).toBe(custom)
    expect(await resolveClient(asynchronous, undefined, metadataConfig as never)).toBe(custom)
    expect(sync).toHaveBeenCalledWith('token', 'metadata')
    expect(asynchronous).toHaveBeenCalledWith(undefined, metadataConfig)
    expectNoRequestApiAccess()
  })

  it.each([
    ['a plain object', {}],
    ['a factory returning a plain object', () => ({})],
    ['an async factory returning nothing', async () => undefined],
    ['a string', 'client']
  ])('throws for %s', async (_name, input) => {
    await expect(resolveClient(input as never)).rejects.toThrow(
      'The client must be an instance of IOptiGraphClient or a factory function returning the client'
    )
  })

  it('identifies factories by being a function', () => {
    expect(isClientFactory(createNextJsClient)).toBe(true)
    expect(isClientFactory({})).toBe(false)
    expect(isClientFactory()).toBe(false)
  })
})

describe('creating pages and layouts', () => {
  it('does not read the Next.js request APIs when a page or layout is created', () => {
    draftModeState.isEnabled = true
    createPage({} as never)
    createLayout()
    expectNoRequestApiAccess()
  })

  it('createPage serves drafts for rendering and metadata, never for static params', async () => {
    draftModeState.isEnabled = true
    const clients = await runPage()
    expect(clients.staticParams?.currentAuthMode).toBe(AuthMode.Public)
    expect(clients.staticParams?.isPreviewEnabled()).toBe(false)
    for (const key of ['metadata', 'render'] as const) {
      expect(clients[key]?.currentAuthMode).toBe(AuthMode.HMAC)
      expect(clients[key]?.isPreviewEnabled()).toBe(true)
    }
  })

  it('createPage does not read Draft Mode for static params', async () => {
    draftModeState.isEnabled = true
    await createPage({} as never, {
      routerFactory: (() => ({ getRoutes: async () => [] })) as never
    }).generateStaticParams()
    expectNoRequestApiAccess()
  })

  it('createPage keeps serving published content when Draft Mode is off', async () => {
    const clients = await runPage()
    for (const key of ['staticParams', 'metadata', 'render'] as const) {
      expect(clients[key]?.currentAuthMode).toBe(AuthMode.Public)
      expect(clients[key]?.isPreviewEnabled()).toBe(false)
    }
  })

  it('createPage honours a custom client option as is, called with the scope', async () => {
    draftModeState.isEnabled = true
    const custom = await createNextJsClient(undefined, 'metadata')
    const factory = vi.fn(() => custom)
    const clients = await runPage({ client: factory })
    expect(factory.mock.calls.map(c => c.at(1))).toEqual(['metadata', 'request', 'request'])
    expect(clients.render).toBe(custom)
    expect(clients.render?.isPreviewEnabled()).toBe(false)
    expectNoRequestApiAccess()
  })

  it('createPage honours a Graph client instance as the client option for every path', async () => {
    draftModeState.isEnabled = true
    const custom = await createNextJsClient(undefined, 'metadata')
    const clients = await runPage({ client: custom })
    expect(clients).toEqual({ staticParams: custom, metadata: custom, render: custom })
    expectNoRequestApiAccess()
  })

  it('createLayout honours a Graph client instance as the client option', async () => {
    draftModeState.isEnabled = true
    const custom = await createNextJsClient(undefined, 'metadata')
    expect(await runLayout({ client: custom })).toBe(custom)
    expectNoRequestApiAccess()
  })

  it('createLayout requests its client in the metadata scope, without reading Draft Mode', async () => {
    draftModeState.isEnabled = true
    const received = await runLayout()
    expectNoRequestApiAccess()
    expect(received?.currentAuthMode).toBe(AuthMode.Public)
    expect(received?.isPreviewEnabled()).toBe(false)
  })

  it('createLayout honours a custom (async) client option as is', async () => {
    const custom = await createNextJsClient(undefined, 'metadata')
    const factory = vi.fn(async () => custom)
    expect(await runLayout({ client: factory })).toBe(custom)
    expect(factory).toHaveBeenCalledWith(undefined, 'metadata')
  })
})

describe('edit view page', () => {
  const editProps = { params: Promise.resolve({}), searchParams: Promise.resolve({}) } as never
  const edit = (client: unknown) => createEditPageComponent({} as never, {
    clientFactory: client as never,
    requestValidator: () => true,
    contentResolver: (() => ({ key: 'abcdef', locale: 'en', ctx: 'edit', token: 'edit-token' })) as never
  })

  it('calls the client factory with the request token and the metadata scope, without reading Draft Mode', async () => {
    draftModeState.isEnabled = true
    const custom = await createNextJsClient(undefined, 'metadata')
    const factory = vi.fn(async () => custom)
    await edit(factory)(editProps)
    expect(factory).toHaveBeenCalledWith('edit-token', 'metadata')
    expectNoRequestApiAccess()
  })

  it('accepts a Graph client instance as the client option', async () => {
    const custom = await createNextJsClient(undefined, 'metadata')
    await expect(edit(custom)(editProps)).resolves.toBeDefined()
  })

  it('refuses a factory that does not return a Graph client', async () => {
    await expect(edit(() => ({}))(editProps)).rejects.toThrow('The client must be an instance of IOptiGraphClient')
  })

  it('creates the default client in the metadata scope, so it never reads Draft Mode', async () => {
    draftModeState.isEnabled = true
    const page = createEditPageComponent({} as never, {
      requestValidator: () => true,
      contentResolver: (() => ({ key: 'abcdef', locale: 'en', ctx: 'edit' })) as never
    })
    await page(editProps)
    expectNoRequestApiAccess()
  })
})

describe('publish API', () => {
  const publishRequest = (token: string) => new NextRequest(`https://example.com/publish?token=${token}`)

  it('accepts a Graph client instance, an async factory and the default factory', async () => {
    const instance = await createNextJsClient(undefined, { ...(config as object), scope: 'metadata' } as never)
    const factory = vi.fn(async () => instance)
    for (const client of [instance, factory] as const) {
      const response = await createPublishApi({ client })(publishRequest('publish-token'))
      expect(response.status).toBe(200)
    }
    expect(factory).toHaveBeenCalledTimes(1)
  })

  it('reads the client in the metadata scope, so the default client never reads Draft Mode', async () => {
    draftModeState.isEnabled = true
    vi.stubEnv('OPTIMIZELY_PUBLISH_TOKEN', 'publish-token')
    expect((await createPublishApi()(publishRequest('publish-token'))).status).toBe(200)
    expectNoRequestApiAccess()

    const instance = await createNextJsClient(undefined, { ...(config as object), scope: 'metadata' } as never)
    const factory = vi.fn(() => instance)
    await createPublishApi({ client: factory })(publishRequest('publish-token'))
    expect(factory).toHaveBeenCalledWith(undefined, 'metadata')
  })

  it('rejects a wrong token for a Graph client instance', async () => {
    const instance = await createNextJsClient(undefined, { ...(config as object), scope: 'metadata' } as never)
    const response = await createPublishApi({ client: instance })(publishRequest('wrong'))
    expect(response.status).toBe(401)
  })

  it('validates a webhook with the default client, without switching it to drafts', async () => {
    vi.stubEnv('OPTIMIZELY_PUBLISH_TOKEN', 'publish-token')
    const response = await createPublishApi()(publishRequest('publish-token'))
    expect(response.status).toBe(200)
  })

  it.each([
    ['a plain object', { siteInfo: { publishToken: 'publish-token' } }],
    ['a factory returning a plain object', () => ({ siteInfo: { publishToken: 'publish-token' } })],
    ['an async factory returning nothing', async () => undefined],
    ['a string', 'client']
  ])('refuses %s as the client', async (_name, client) => {
    await expect(createPublishApi({ client: client as never })(publishRequest('publish-token'))).rejects.toThrow(
      'The client must be an instance of IOptiGraphClient or a factory function returning the client'
    )
  })
})

describe('logger', () => {
  it('writes warnings to stderr regardless of the environment', () => {
    expect(process.env.NODE_ENV).toBe('production')
    logger.warn('warning', 1)
    expect(warn).toHaveBeenCalledWith('warning', 1)
    expect(stdout.reduce((total, spy) => total + spy.mock.calls.length, 0)).toBe(0)
  })
})
