import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createOptiCmsApp } from '../src/app'

const ENV = {
  OPTIMIZELY_CMS_URL: 'https://cms.example.com',
  OPTIMIZELY_CMS_CLIENT_ID: 'client-id-unit-test',
  OPTIMIZELY_CMS_CLIENT_SECRET: 'ClientSecretUnitTest0123456789abcdefghij'
}

describe('createOptiCmsApp secret handling', () => {
  let output: string[]
  let previousEnv: Record<string, string | undefined>

  beforeEach(() => {
    previousEnv = {}
    for (const [key, value] of Object.entries(ENV)) {
      previousEnv[key] = process.env[key]
      process.env[key] = value
    }
    output = []
    const capture = (...args: unknown[]) => { output.push(args.map(String).join(' ')) }
    vi.spyOn(console, 'log').mockImplementation(capture)
    vi.spyOn(console, 'error').mockImplementation(capture)
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => { output.push(String(chunk)); return true })
    vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined)
        delete process.env[key]
      else
        process.env[key] = value
    }
  })

  function expectMasked() {
    const text = output.join('\n')
    const secret = ENV.OPTIMIZELY_CMS_CLIENT_SECRET
    expect(text).toContain('API Client Secrent')
    expect(text).not.toContain(secret)
    expect(text).not.toContain(secret.substring(0, 8))
    expect(text).toContain(`${secret.substring(0, 4)}********`)
  }

  it('does not print the client secret in --help output', async () => {
    const app = createOptiCmsApp('test-cli', '0.0.0')
    await app.exitProcess(false).parse(['--help'])
    expectMasked()
  })

  it('does not print the client secret in the usage error output', async () => {
    const app = createOptiCmsApp('test-cli', '0.0.0')
    await app.exitProcess(false).parse(['--no-such-option-given'])
    expectMasked()
  })

  it('keeps the real client secret as runtime default', async () => {
    const app = createOptiCmsApp('test-cli', '0.0.0')
    const args = await app.exitProcess(false).command('noop', 'noop', {}, () => { }).parse(['noop'])
    expect(args.client_secret).toBe(ENV.OPTIMIZELY_CMS_CLIENT_SECRET)
  })
})
