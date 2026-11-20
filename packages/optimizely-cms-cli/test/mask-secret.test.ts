import { describe, expect, it } from 'vitest'
import { maskSecret } from '../src/utils/mask-secret'

describe('maskSecret', () => {
  it.each([undefined, null, ''])('returns undefined for %j', value => {
    expect(maskSecret(value)).toBeUndefined()
  })

  it('fully masks short values', () => {
    expect(maskSecret('a')).toBe('********')
    expect(maskSecret('1234567')).toBe('********')
  })

  it('reveals a quarter of medium values', () => {
    expect(maskSecret('12345678')).toBe('12********')
    expect(maskSecret('123456789012')).toBe('123********')
  })

  it('reveals at most four leading characters of long values', () => {
    expect(maskSecret('1234567890123456')).toBe('1234********')
    expect(maskSecret('x'.repeat(200))).toBe('xxxx********')
  })

  it('uses a fixed-length mask so the value length is not revealed', () => {
    expect(maskSecret('abcdefghijklmnop')?.length).toBe(maskSecret('abcdefghijklmnopqrstuvwxyz0123456789')?.length)
  })

  it('never contains the complete value', () => {
    for (const value of ['a', 'abcdefgh', 'abcdefghijklmnop', 'x'.repeat(64)])
      expect(maskSecret(value)).not.toContain(value)
  })
})
