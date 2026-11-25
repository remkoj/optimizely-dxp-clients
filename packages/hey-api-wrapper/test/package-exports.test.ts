import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

// Resolves through the package `exports` map, so it needs a built `dist`
const require = createRequire(import.meta.url)

describe('package exports', () => {
  it('resolves the root entry point', () => {
    expect(require.resolve('@remkoj/hey-api-wrapper')).toMatch(/dist[\\/]index\.js$/)
  })

  it('resolves the ./hmac subpath to the HMAC fetch', () => {
    const hmac = require('@remkoj/hey-api-wrapper/hmac')
    expect(require.resolve('@remkoj/hey-api-wrapper/hmac')).toMatch(/dist[\\/]hmac-fetch\.js$/)
    expect(typeof hmac.createHmacFetch).toBe('function')
  })

  it('does not export the HMAC fetch from the root entry point', () => {
    expect(require('@remkoj/hey-api-wrapper').createHmacFetch).toBeUndefined()
  })

  it('exposes package.json', () => {
    expect(require('@remkoj/hey-api-wrapper/package.json').name).toBe('@remkoj/hey-api-wrapper')
  })
})
