import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCliApp } from '../src/app'

const SECRETS = {
  OPTIMIZELY_GRAPH_APP_KEY: 'AppKeyUnitTest0123456789abcdef',
  OPTIMIZELY_GRAPH_SECRET: 'SecretUnitTest0123456789abcdefghij',
  OPTIMIZELY_GRAPH_SINGLE_KEY: 'SingleKeyUnitTest0123456789abcdef'
}

describe('createCliApp secret handling', () => {
  let output: string[]
  let previousEnv: Record<string, string | undefined>

  beforeEach(() => {
    previousEnv = {}
    for (const [key, value] of Object.entries(SECRETS)) {
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
    expect(text).toContain('Content Graph Secret')
    for (const secret of Object.values(SECRETS)) {
      expect(text).not.toContain(secret)
      expect(text).not.toContain(secret.substring(0, 8))
    }
    for (const secret of Object.values(SECRETS))
      expect(text).toContain(`${secret.substring(0, 4)}********`)
  }

  it('does not print secrets in --help output', async () => {
    const app = createCliApp('test-cli', '0.0.0')
    await app.exitProcess(false).parse(['--help'])
    expectMasked()
  })

  it('does not print secrets in the usage error output', async () => {
    const app = createCliApp('test-cli', '0.0.0')
    await app.exitProcess(false).parse(['--no-such-option-given'])
    expectMasked()
  })

  it('keeps the real secrets as runtime defaults', async () => {
    const app = createCliApp('test-cli', '0.0.0')
    const args = await app.exitProcess(false).command('noop', 'noop', {}, () => { }).parse(['noop'])
    expect(args.app_key).toBe(SECRETS.OPTIMIZELY_GRAPH_APP_KEY)
    expect(args.secret).toBe(SECRETS.OPTIMIZELY_GRAPH_SECRET)
    expect(args.single_key).toBe(SECRETS.OPTIMIZELY_GRAPH_SINGLE_KEY)
  })
})
