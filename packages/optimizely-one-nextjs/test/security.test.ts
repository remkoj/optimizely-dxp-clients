import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applyDynamicSecurityHeaders,
  buildContentSecurityPolicy,
  buildOptimizelySecurityHeaders,
  getSecurityPolicySources,
  type SecurityPolicyConfig
} from '../src/security'

const WEBEX_PROJECT = '1234567'
const webEx: SecurityPolicyConfig = { WebExperimentationProject: WEBEX_PROJECT }

// Core Web Experimentation sources, not governed by webExVeActive
const CORE_SCRIPT = ['https://cdn.optimizely.com', 'https://*.cdn.optimizely.com', '\'unsafe-eval\'']
const CORE_CONNECT = [
  'https://cdn.optimizely.com',
  'https://*.cdn.optimizely.com',
  'https://logx.optimizely.com',
  'https://rum.optimizely.com',
  'https://prediction.cmab.optimizely.com'
]
const CORE_FRAME = ['https://cdn.optimizely.com', 'https://*.cdn.optimizely.com']

// Visual editor (VE) sources, only included when webExVeActive is not false
const VE_HOST = 'https://app.optimizely.com'
const VE_WS = 'wss://*.app.optimizely.com'
const VE_GA = 'https://*.google-analytics.com'

function directive(policy: string, name: string): string[] {
  const found = policy.split('; ').find(part => part.startsWith(name + ' '))
  return found ? found.slice(name.length + 1).split(' ') : []
}

beforeEach(() => {
  // The helpers fall back to the environment, so make sure the tests don't depend on it
  for (const key of Object.keys(process.env).filter(name => name.startsWith('OPTIMIZELY_') || name.startsWith('OPTIMIZLEY_')))
    vi.stubEnv(key, undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getSecurityPolicySources', () => {
  it('returns empty sources for all directives without configured products', () => {
    expect(getSecurityPolicySources()).toEqual({
      'script-src': [],
      'connect-src': [],
      'img-src': [],
      'frame-src': [],
      'style-src': [],
      'font-src': [],
      'worker-src': []
    })
  })

  it('omits all Web Experimentation sources without a project, regardless of webExVeActive', () => {
    for (const webExVeActive of [undefined, null, true, false])
      expect(getSecurityPolicySources({ webExVeActive })).toEqual(getSecurityPolicySources())
  })

  it('reads the Web Experimentation project from the environment', () => {
    vi.stubEnv('OPTIMIZELY_WEB_EXPERIMENTATION_PROJECT', WEBEX_PROJECT)
    expect(getSecurityPolicySources()['script-src']).toContain('https://cdn.optimizely.com')
  })

  it.each([undefined, null, true])('includes the core and VE sources when webExVeActive is %s', (webExVeActive) => {
    const sources = getSecurityPolicySources({ ...webEx, webExVeActive })
    expect(sources['script-src']).toEqual(expect.arrayContaining([...CORE_SCRIPT, VE_HOST, VE_GA]))
    expect(sources['connect-src']).toEqual(expect.arrayContaining([...CORE_CONNECT, VE_HOST, VE_WS, VE_GA]))
    expect(sources['frame-src']).toEqual(expect.arrayContaining([...CORE_FRAME, VE_HOST]))
    expect(sources['style-src']).toContain(VE_HOST)
    expect(sources['font-src']).toContain(VE_HOST)
    expect(sources['worker-src']).toEqual(['blob:'])
  })

  it('keeps only the core Web Experimentation sources when webExVeActive is false', () => {
    const sources = getSecurityPolicySources({ ...webEx, webExVeActive: false })
    expect(sources).toEqual({
      'script-src': CORE_SCRIPT,
      'connect-src': CORE_CONNECT,
      'img-src': [],
      'frame-src': CORE_FRAME,
      'style-src': [],
      'font-src': [],
      'worker-src': []
    })
  })

  it('returns deduplicated sources per directive', () => {
    const sources = getSecurityPolicySources(webEx)
    for (const list of Object.values(sources))
      expect(new Set(list).size).toBe(list.length)
  })

  it('adds the Data Platform sources when an ODP id is configured', () => {
    const sources = getSecurityPolicySources({ OdpApiKey: 'abc123.def', OdpService: 'https://api.zaius.com/' })
    expect(sources['script-src']).toContain('https://d1igp3oop3iho5.cloudfront.net')
    expect(sources['connect-src']).toEqual(expect.arrayContaining([
      'https://d1igp3oop3iho5.cloudfront.net',
      'https://api.zaius.com',
      'https://*.odp.optimizely.com'
    ]))
    expect(sources['img-src']).toContain('https://api.zaius.com')
  })

  it('adds the Content Recommendations sources when client and delivery are configured', () => {
    const sources = getSecurityPolicySources({ ContentRecsClient: '1234', ContentRecsDelivery: 5678, ContentRecsHost: 'idio.co' })
    expect(sources['script-src']).toContain('https://s.idio.co')
    expect(sources['connect-src']).toContain('https://*.idio.co')
    expect(sources['img-src']).toEqual(expect.arrayContaining(['https://*.idio.co', 'https://i.idio.co']))
  })
})

describe('buildContentSecurityPolicy', () => {
  it('returns an empty policy without products or extra sources', () => {
    expect(buildContentSecurityPolicy()).toBe('')
  })

  it('emits only directives that have sources', () => {
    const policy = buildContentSecurityPolicy({ 'img-src': ['\'self\''] })
    expect(policy).toBe('img-src \'self\'')
  })

  it('puts extra sources before the product sources and joins directives with a semicolon', () => {
    const policy = buildContentSecurityPolicy({ 'script-src': ['\'self\''] }, { ...webEx, webExVeActive: false })
    expect(directive(policy, 'script-src')).toEqual(['\'self\'', ...CORE_SCRIPT])
    expect(policy.split('; ').map(part => part.split(' ')[0])).toEqual(['script-src', 'connect-src', 'frame-src'])
  })

  it('deduplicates sources that are both provided and required', () => {
    const policy = buildContentSecurityPolicy({ 'script-src': ['https://cdn.optimizely.com', '\'self\'', '\'self\''] }, webEx)
    const scripts = directive(policy, 'script-src')
    expect(scripts.filter(source => source === 'https://cdn.optimizely.com')).toHaveLength(1)
    expect(scripts.filter(source => source === '\'self\'')).toHaveLength(1)
  })

  it('keeps the extra sources for all managed directives', () => {
    const extra = {
      'script-src': ['a'],
      'connect-src': ['b'],
      'img-src': ['c'],
      'frame-src': ['d'],
      'style-src': ['e'],
      'font-src': ['f'],
      'worker-src': ['g']
    }
    expect(buildContentSecurityPolicy(extra)).toBe('script-src a; connect-src b; img-src c; frame-src d; style-src e; font-src f; worker-src g')
  })

  it.each([undefined, null, true])('includes the VE sources when webExVeActive is %s', (webExVeActive) => {
    const policy = buildContentSecurityPolicy({}, { ...webEx, webExVeActive })
    expect(directive(policy, 'script-src')).toContain(VE_HOST)
    expect(directive(policy, 'worker-src')).toEqual(['blob:'])
  })

  it('omits the VE sources, but not the core sources, when webExVeActive is false', () => {
    const policy = buildContentSecurityPolicy({}, { ...webEx, webExVeActive: false })
    expect(policy).not.toContain('app.optimizely.com')
    expect(policy).not.toContain('blob:')
    expect(policy).not.toContain('google-analytics')
    expect(directive(policy, 'script-src')).toEqual(CORE_SCRIPT)
    expect(directive(policy, 'connect-src')).toEqual(CORE_CONNECT)
  })

  it('emits no Web Experimentation sources without a project', () => {
    expect(buildContentSecurityPolicy({ 'script-src': ['\'self\''] }, { webExVeActive: true })).toBe('script-src \'self\'')
  })
})

describe('buildOptimizelySecurityHeaders', () => {
  it('returns the CSP and the same-origin COOP', () => {
    const headers = buildOptimizelySecurityHeaders({ 'img-src': ['\'self\''] })
    expect(headers).toEqual({
      'Content-Security-Policy': 'img-src \'self\'',
      'Cross-Origin-Opener-Policy': 'same-origin'
    })
  })

  it('returns the COOP with an empty CSP when nothing is configured', () => {
    expect(buildOptimizelySecurityHeaders()).toEqual({
      'Content-Security-Policy': '',
      'Cross-Origin-Opener-Policy': 'same-origin'
    })
  })

  it('builds the CSP like buildContentSecurityPolicy', () => {
    const extra = { 'script-src': ['\'self\''] }
    for (const webExVeActive of [undefined, null, true, false]) {
      const config = { ...webEx, webExVeActive }
      expect(buildOptimizelySecurityHeaders(extra, config)['Content-Security-Policy']).toBe(buildContentSecurityPolicy(extra, config))
    }
  })
})

describe('applyDynamicSecurityHeaders', () => {
  const base = { 'script-src': ['\'self\'', '\'unsafe-inline\''], 'worker-src': ['\'self\''] }

  it('sets the complete CSP and COOP on the headers and returns the same instance', () => {
    const headers = new Headers()
    const result = applyDynamicSecurityHeaders(headers, base, { config: { ...webEx, webExVeActive: false } })
    expect(result).toBe(headers)
    expect(headers.get('Content-Security-Policy')).toBe(
      buildOptimizelySecurityHeaders(base, { ...webEx, webExVeActive: false })['Content-Security-Policy']
    )
    expect(headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin')
  })

  it('overwrites an existing CSP and COOP and leaves other headers alone', () => {
    const headers = new Headers({
      'Content-Security-Policy': 'default-src \'none\'',
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'X-Other': 'kept'
    })
    applyDynamicSecurityHeaders(headers, base)
    expect(headers.get('Content-Security-Policy')).toBe('script-src \'self\' \'unsafe-inline\'; worker-src \'self\'')
    expect(headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin')
    expect(headers.get('X-Other')).toBe('kept')
  })

  it('includes the VE sources on top of the base when webExVeActive is true', () => {
    const headers = applyDynamicSecurityHeaders(new Headers(), base, { webExVeActive: true, config: webEx })
    const policy = headers.get('Content-Security-Policy') ?? ''
    expect(directive(policy, 'script-src')).toEqual(expect.arrayContaining(['\'self\'', '\'unsafe-inline\'', VE_HOST]))
    expect(directive(policy, 'worker-src')).toEqual(['\'self\'', 'blob:'])
  })

  it.each([undefined, null])('includes the VE sources when webExVeActive is %s', (webExVeActive) => {
    const headers = applyDynamicSecurityHeaders(new Headers(), base, { webExVeActive, config: webEx })
    expect(directive(headers.get('Content-Security-Policy') ?? '', 'script-src')).toContain(VE_HOST)
  })

  it('omits the VE sources when webExVeActive is false, keeping the core sources', () => {
    const headers = applyDynamicSecurityHeaders(new Headers(), base, { webExVeActive: false, config: webEx })
    const policy = headers.get('Content-Security-Policy') ?? ''
    expect(policy).not.toContain('app.optimizely.com')
    expect(directive(policy, 'script-src')).toEqual(['\'self\'', '\'unsafe-inline\'', ...CORE_SCRIPT])
    expect(directive(policy, 'worker-src')).toEqual(['\'self\''])
  })

  it('lets the option override config.webExVeActive in both directions', () => {
    const forced = applyDynamicSecurityHeaders(new Headers(), base, { webExVeActive: true, config: { ...webEx, webExVeActive: false } })
    expect(forced.get('Content-Security-Policy')).toContain(VE_HOST)
    const disabled = applyDynamicSecurityHeaders(new Headers(), base, { webExVeActive: false, config: { ...webEx, webExVeActive: true } })
    expect(disabled.get('Content-Security-Policy')).not.toContain(VE_HOST)
  })

  it('uses config.webExVeActive when the option is not provided', () => {
    const disabled = applyDynamicSecurityHeaders(new Headers(), base, { config: { ...webEx, webExVeActive: false } })
    expect(disabled.get('Content-Security-Policy')).not.toContain(VE_HOST)
  })

  it('emits no Web Experimentation sources without a project, regardless of the option', () => {
    for (const webExVeActive of [undefined, null, true, false]) {
      const headers = applyDynamicSecurityHeaders(new Headers(), base, { webExVeActive })
      expect(headers.get('Content-Security-Policy')).toBe('script-src \'self\' \'unsafe-inline\'; worker-src \'self\'')
    }
  })

  it('merges extra sources with the base per directive, deduplicated and never removing base sources', () => {
    const headers = applyDynamicSecurityHeaders(new Headers(), base, {
      extra: { 'script-src': ['\'self\'', 'https://extra.example'], 'connect-src': ['https://api.example'] }
    })
    const policy = headers.get('Content-Security-Policy') ?? ''
    expect(directive(policy, 'script-src')).toEqual(['\'self\'', '\'unsafe-inline\'', 'https://extra.example'])
    expect(directive(policy, 'connect-src')).toEqual(['https://api.example'])
    expect(directive(policy, 'worker-src')).toEqual(['\'self\''])
  })

  it('does not modify the base or extra arguments', () => {
    const extra = { 'script-src': ['https://extra.example'] }
    applyDynamicSecurityHeaders(new Headers(), base, { extra, webExVeActive: true, config: webEx })
    expect(base).toEqual({ 'script-src': ['\'self\'', '\'unsafe-inline\''], 'worker-src': ['\'self\''] })
    expect(extra).toEqual({ 'script-src': ['https://extra.example'] })
  })

  it('produces the same policy as the static builder for the same inputs', () => {
    for (const webExVeActive of [undefined, null, true, false]) {
      const headers = applyDynamicSecurityHeaders(new Headers(), base, { webExVeActive, config: webEx })
      const expected = buildOptimizelySecurityHeaders(base, { ...webEx, webExVeActive })
      expect(headers.get('Content-Security-Policy')).toBe(expected['Content-Security-Policy'])
    }
  })
})
