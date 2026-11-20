import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'

// Run effects while rendering, so the console output of effects can be observed without a browser
vi.mock('react', async importOriginal => {
  const react = await importOriginal<typeof import('react')>()
  return {
    ...react,
    useEffect: (effect: () => void) => { queueMicrotask(() => { try { effect() } catch { /* state updates after the server render are irrelevant here */ } }) },
    useLayoutEffect: (effect: () => void) => { queueMicrotask(() => { try { effect() } catch { /* state updates after the server render are irrelevant here */ } }) }
  }
})
const passThrough = ({ children }: { children?: unknown }) => children
vi.mock('@optiaxiom/react', () => new Proxy({}, { get: (_target, name) => name == 'then' ? undefined : passThrough }))
vi.mock('@optiaxiom/icons', () => new Proxy({}, { get: (_target, name) => name == 'then' ? undefined : passThrough }))
vi.mock('../src/components/context', () => ({ useOptimizelyOne: () => ({ enabledOptimizelyProducts: [] }) }))
vi.mock('next/navigation', () => ({ usePathname: () => '/page' }))

import { renderToString } from 'react-dom/server'
import { ContentRecsDelivery } from '../src/products/content-recs/delivery'
import OptimizelyOneGadget from '../src/components/optimizely-one-gadget/gadget'

/** The outputs that end up on stdout */
let stdout: Array<MockInstance>

function stdoutCalls() {
  return stdout.reduce((total, spy) => total + spy.mock.calls.length, 0)
}

/** Render the Client Components that log on regular (non-debug) usage */
async function triggerReports() {
  vi.stubGlobal('window', { location: { href: 'https://example.com/page' } })
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('failed')))
  renderToString(<ContentRecsDelivery apiKey="key" template={() => null} />)
  renderToString(<OptimizelyOneGadget />)
  await new Promise(resolve => setTimeout(resolve, 10))
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
  vi.unstubAllGlobals()
})

describe('stdout output', () => {
  it('is silent with NODE_ENV=production and OPTIMIZELY_DEBUG=0', async () => {
    expect(process.env.NODE_ENV).toBe('production')
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
