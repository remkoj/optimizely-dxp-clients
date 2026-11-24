import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { readEnvironmentVariables, DEFAULT_PUBLISH_HEADER, EXPANDED_BY_CONFIG, resolvePublishHeader } from '../src/config.js'
import { ContentGraphClient } from '../src/client/client.js'

let warn: MockInstance

beforeEach(() => {
  vi.stubEnv('OPTIMIZELY_GRAPH_SINGLE_KEY', 'single')
  vi.stubEnv('OPTIMIZELY_PUBLISH_TOKEN', '')
  vi.stubEnv('OPTIMIZELY_PUBLISH_HEADER', '')
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('publish header', () => {
  it('defaults to X-OPTLY-PUBLISH', () => {
    expect(DEFAULT_PUBLISH_HEADER).toBe('X-OPTLY-PUBLISH')
    expect(readEnvironmentVariables().publish_header).toBe('X-OPTLY-PUBLISH')
  })

  it('can be overridden using OPTIMIZELY_PUBLISH_HEADER', () => {
    vi.stubEnv('OPTIMIZELY_PUBLISH_HEADER', 'x-optimizely-graph-publish')
    expect(readEnvironmentVariables().publish_header).toBe('x-optimizely-graph-publish')
  })

  it('exposes the header and token through siteInfo', () => {
    vi.stubEnv('OPTIMIZELY_PUBLISH_HEADER', 'x-vercel-protection-bypass')
    vi.stubEnv('OPTIMIZELY_PUBLISH_TOKEN', 'abc')
    const info = new ContentGraphClient().siteInfo
    expect(info.publishHeader).toBe('x-vercel-protection-bypass')
    expect(info.publishToken).toBe('abc')
  })

  it('uses the default header in siteInfo when not configured', () => {
    expect(new ContentGraphClient().siteInfo.publishHeader).toBe(DEFAULT_PUBLISH_HEADER)
  })

  it.each(['x publish', 'x:publish', 'x-publish\r\nInjected: 1', 'päth', 'a,b', '(x)'])('rejects the invalid header name %j', (name) => {
    expect(() => resolvePublishHeader(name)).toThrow(/OPTIMIZELY_PUBLISH_HEADER/)
  })

  it('does not echo an invalid header name value in the error', () => {
    let message = ''
    try {
      resolvePublishHeader('bad value')
    } catch (e) {
      message = (e as Error).message
    }
    expect(message).toContain('OPTIMIZELY_PUBLISH_HEADER')
    expect(message).not.toContain('bad value')
  })

  it('throws while reading an invalid environment value', () => {
    vi.stubEnv('OPTIMIZELY_PUBLISH_HEADER', 'not valid')
    expect(() => readEnvironmentVariables()).toThrow(/OPTIMIZELY_PUBLISH_HEADER/)
  })
})

describe('publish token expansion', () => {
  it('returns a plain token unchanged', () => {
    vi.stubEnv('OPTIMIZELY_PUBLISH_TOKEN', 'plain-token')
    expect(readEnvironmentVariables().publish).toBe('plain-token')
  })

  it('expands ${VERCEL_AUTOMATION_BYPASS_SECRET}', () => {
    vi.stubEnv('VERCEL_AUTOMATION_BYPASS_SECRET', 'bypass-secret')
    vi.stubEnv('OPTIMIZELY_PUBLISH_TOKEN', '${VERCEL_AUTOMATION_BYPASS_SECRET}')
    expect(readEnvironmentVariables().publish).toBe('bypass-secret')
  })

  it('expands a reference embedded in a larger value', () => {
    vi.stubEnv('PART', 'middle')
    vi.stubEnv('OPTIMIZELY_PUBLISH_TOKEN', 'a-${PART}-z')
    expect(readEnvironmentVariables().publish).toBe('a-middle-z')
  })

  it('expands references in the header name', () => {
    vi.stubEnv('HEADER_NAME', 'x-vercel-protection-bypass')
    vi.stubEnv('OPTIMIZELY_PUBLISH_HEADER', '${HEADER_NAME}')
    expect(readEnvironmentVariables().publish_header).toBe('x-vercel-protection-bypass')
  })

  it('leaves a token containing a bare $ untouched', () => {
    vi.stubEnv('OPTIMIZELY_PUBLISH_TOKEN', 'pa$word$abc')
    expect(readEnvironmentVariables().publish).toBe('pa$word$abc')
  })

  it('does not modify process.env or other variables', () => {
    vi.stubEnv('OTHER', '${NOT_EXPANDED}')
    vi.stubEnv('VERCEL_AUTOMATION_BYPASS_SECRET', 'bypass-secret')
    vi.stubEnv('OPTIMIZELY_PUBLISH_TOKEN', '${VERCEL_AUTOMATION_BYPASS_SECRET}')
    readEnvironmentVariables()
    expect(process.env.OTHER).toBe('${NOT_EXPANDED}')
    expect(process.env.OPTIMIZELY_PUBLISH_TOKEN).toBe('${VERCEL_AUTOMATION_BYPASS_SECRET}')
  })

  it('treats an unresolved reference as not configured and warns without leaking values', () => {
    vi.stubEnv('OPTIMIZELY_PUBLISH_TOKEN', 'prefix-${DOES_NOT_EXIST_ANYWHERE}')
    expect(readEnvironmentVariables().publish).toBeUndefined()
    expect(warn).toHaveBeenCalledTimes(1)
    const message = String(warn.mock.calls[0][0])
    expect(message).toContain('OPTIMIZELY_PUBLISH_TOKEN')
    expect(message).not.toContain('prefix')
  })

  it('does not print the publish token when debugging the configuration', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.stubEnv('OPTIMIZELY_DEBUG', '1')
    vi.stubEnv('OPTIMIZELY_PUBLISH_TOKEN', 'super-secret-token')
    readEnvironmentVariables()
    expect(log.mock.calls.flat().join(' ')).not.toContain('super-secret-token')
  })
})

describe('single expansion of references', () => {
  it('does not expand the value of a referenced variable again', () => {
    vi.stubEnv('REFERENCED', 'literal-${OTHER}-value')
    vi.stubEnv('OTHER', 'expanded-twice')
    vi.stubEnv('OPTIMIZELY_PUBLISH_TOKEN', '${REFERENCED}')
    expect(readEnvironmentVariables().publish).toBe('literal-${OTHER}-value')
  })

  it('does not expand unbraced $names next to a reference', () => {
    vi.stubEnv('PART', 'middle')
    vi.stubEnv('word', 'expanded')
    vi.stubEnv('OPTIMIZELY_PUBLISH_TOKEN', 'pa$word-${PART}')
    expect(readEnvironmentVariables().publish).toBe('pa$word-middle')
  })

  it('keeps an escaped reference as literal text, without a warning', () => {
    vi.stubEnv('OPTIMIZELY_PUBLISH_TOKEN', 'abc\\${NOT_A_REFERENCE}')
    expect(readEnvironmentVariables().publish).toBe('abc${NOT_A_REFERENCE}')
    expect(warn).not.toHaveBeenCalled()
  })

  it('still expands a reference next to an escaped one', () => {
    vi.stubEnv('PART', 'middle')
    vi.stubEnv('OPTIMIZELY_PUBLISH_TOKEN', '${PART}-\\${LITERAL}')
    expect(readEnvironmentVariables().publish).toBe('middle-${LITERAL}')
  })

  it('exposes the variables that are expanded by the configuration only', () => {
    expect(EXPANDED_BY_CONFIG).toEqual(['OPTIMIZELY_PUBLISH_TOKEN', 'OPTIMIZELY_PUBLISH_HEADER'])
  })
})

describe('unresolved references fail closed', () => {
  it('throws for an unresolved reference in the header name, without leaking values', () => {
    vi.stubEnv('OPTIMIZELY_PUBLISH_HEADER', 'x-${DOES_NOT_EXIST_ANYWHERE}')
    let message = ''
    try {
      readEnvironmentVariables()
    } catch (e) {
      message = (e as Error).message
    }
    expect(message).toContain('OPTIMIZELY_PUBLISH_HEADER')
    expect(message).toContain('not set')
    expect(message).not.toContain('x-')
  })

  it('never yields a partial token', () => {
    vi.stubEnv('OPTIMIZELY_PUBLISH_TOKEN', '${DOES_NOT_EXIST_ANYWHERE}-suffix')
    expect(readEnvironmentVariables().publish).toBeUndefined()
    expect(warn).toHaveBeenCalledTimes(1)
  })
})

describe('debug output of the configuration', () => {
  it('masks the credentials', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.stubEnv('OPTIMIZELY_DEBUG', '1')
    vi.stubEnv('OPTIMIZELY_GRAPH_SECRET', 'graph-secret-value-0123456789')
    vi.stubEnv('OPTIMIZELY_GRAPH_APP_KEY', 'graph-app-key-value-0123456789')
    vi.stubEnv('OPTIMIZELY_GRAPH_SINGLE_KEY', 'graph-single-key-value-0123456789')
    readEnvironmentVariables()
    const printed = log.mock.calls.flat().join(' ')
    expect(printed).toContain('Detected configuration')
    expect(printed).not.toContain('graph-secret')
    expect(printed).not.toContain('graph-app-key')
    expect(printed).not.toContain('graph-single-key')
  })
})
