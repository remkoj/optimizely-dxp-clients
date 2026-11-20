import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
vi.mock('server-only', () => ({}))

import type { IOptiGraphClient } from '@remkoj/optimizely-graph-client'
import type { GenericContext } from '../src/context/types.js'
import { resolveComponentType } from '../src/utilities.js'
import { resolveComponent } from '../src/components/cms-content/resolve-component.js'
import { getContentType } from '../src/components/cms-content/get-content-type.js'
import { getContent } from '../src/components/cms-content/get-content.js'
import { CmsEditable } from '../src/components/cms-editable/index.js'
import { CmsEditable as RscCmsEditable } from '../src/components/rsc-components.js'

const Component = Object.assign(() => null, { displayName: 'TestComponent' })
const emptyFactory = { resolve: () => undefined } as unknown as GenericContext['factory']
const inlineLink = { key: null, locale: 'en', __typename: 'Foo' } as unknown as Parameters<typeof getContentType>[0]

/** The outputs that end up on stdout */
let stdout: Array<MockInstance>

function stdoutCalls() {
  return stdout.reduce((total, spy) => total + spy.mock.calls.length, 0)
}

/** Exercise the code paths that log on regular (non-debug) usage */
async function triggerReports() {
  const ctx = { inEditMode: false, isDebug: false, isDebugOrDevelopment: false, factory: emptyFactory } as unknown as GenericContext

  resolveComponentType(emptyFactory!, ['Missing'])
  const Missing = resolveComponent('Missing', 'component', null, ctx)
  renderToStaticMarkup(<Missing contentLink={{ key: 'abc' }}>child</Missing>)
  expect(() => resolveComponent('Missing', 'component', null, { ...ctx, factory: undefined } as unknown as GenericContext)).toThrow()

  await expect(getContentType(inlineLink, {} as IOptiGraphClient)).rejects.toThrow()
  await expect(getContentType({ key: '', locale: 'en' } as Parameters<typeof getContentType>[0], {} as IOptiGraphClient)).rejects.toThrow()
  expect(() => getContent(undefined, { key: 'abc' }, Component, undefined)).toThrow()

  const Custom = (props: { children?: React.ReactNode }) => <p>{props.children}</p>
  renderToStaticMarkup(<CmsEditable ctx={{ ...ctx, inEditMode: true } as GenericContext} as={Custom} cmsFieldName="title" forwardCtx>child</CmsEditable>)
  expect(() => renderToStaticMarkup(<RscCmsEditable ctx={{ bogus: true } as unknown as GenericContext} />)).toThrow()
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
