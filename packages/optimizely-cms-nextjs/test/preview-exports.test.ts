import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

describe('@remkoj/optimizely-cms-nextjs/preview entry', () => {
  it('does not export withEditFallback (CMS12-only, injected the publish token into preview URLs)', async () => {
    const preview = await import('../src/ope/index.js')
    expect(preview).not.toHaveProperty('withEditFallback')
    expect(Object.keys(preview).filter(key => /EditFallback/i.test(key))).toEqual([])
  })
})
