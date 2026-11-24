import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createOptiCmsApp } from '../src/app'
import { TypesPushCommand } from '../src/commands/types_push'

const ENV_KEYS = ['OPTIMIZELY_CMS_URL', 'OPTIMIZELY_CMS_CLIENT_ID', 'OPTIMIZELY_CMS_CLIENT_SECRET']

describe('createOptiCmsApp', () => {
  let errorOutput: ReturnType<typeof vi.spyOn>
  let stdoutOutput: ReturnType<typeof vi.spyOn>
  const originalEnv: Record<string, string | undefined> = {}

  beforeEach(() => {
    ENV_KEYS.forEach(key => { originalEnv[key] = process.env[key] })
    process.env.OPTIMIZELY_CMS_URL = 'https://cms.example.com'
    process.env.OPTIMIZELY_CMS_CLIENT_ID = 'client'
    process.env.OPTIMIZELY_CMS_CLIENT_SECRET = 'secret'
    errorOutput = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    stdoutOutput = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    ENV_KEYS.forEach(key => {
      if (originalEnv[key] === undefined) delete process.env[key]
      else process.env[key] = originalEnv[key]
    })
  })

  const written = () => errorOutput.mock.calls.map(call => String(call[0])).join('\n')

  it('reports a command error without dumping the full help output', async () => {
    const app = createOptiCmsApp('opti-cms')
    // No command is provided, which is a usage error
    await app.parse([])

    expect(written()).toContain('Not enough non-option arguments')
    expect(written()).not.toContain('Frontend:')
    expect(written()).not.toContain('Optimizely CMS Instance:')
    expect(written()).not.toContain('Debugging:')
    expect(stdoutOutput).not.toHaveBeenCalled()
  })
})

describe('types:push', () => {
  it('describes that existing content types are patched, not replaced', () => {
    expect(TypesPushCommand.describe).toMatch(/create \/ patch/)
    expect(TypesPushCommand.describe).not.toMatch(/replace/)
  })
})
