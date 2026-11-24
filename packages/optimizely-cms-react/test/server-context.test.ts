import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import type { IOptiGraphClient } from '@remkoj/optimizely-graph-client'
import { ServerContext } from '../src/context/rsc.js'

describe('ServerContext editableContentIsExperience', () => {
  const create = () => new ServerContext({ client: {} as IOptiGraphClient, factory: [], mode: 'edit' })

  it('is false by default', () => {
    expect(create().editableContentIsExperience).toBe(false)
  })

  it('can be changed through setEditableContentIsExperience', () => {
    const ctx = create()
    expect(() => ctx.setEditableContentIsExperience(true)).not.toThrow()
    expect(ctx.editableContentIsExperience).toBe(true)
    ctx.setEditableContentIsExperience(false)
    expect(ctx.editableContentIsExperience).toBe(false)
  })

  it('can be changed through direct property assignment', () => {
    const ctx = create()
    expect(() => {
      ctx.editableContentIsExperience = true
    }).not.toThrow()
    expect(ctx.editableContentIsExperience).toBe(true)
  })
})
