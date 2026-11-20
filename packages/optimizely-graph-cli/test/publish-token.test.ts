import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCliApp } from '../src/app'
import publishModule from '../src/commands/publish'
import unpublishModule from '../src/commands/unpublish'

const PUBLISH_TOKEN = 'PublishTokenUnitTest0123456789abcdef'
const ENV_KEYS = [
  'OPTIMIZELY_PUBLISH_TOKEN',
  'FRONTEND_PUBLISH_TOKEN',
  'OPTIMIZELY_GRAPH_APP_KEY',
  'OPTIMIZELY_GRAPH_SECRET',
  'OPTIMIZELY_GRAPH_SINGLE_KEY'
]

describe.each([
  { name: 'webhook:create', module: publishModule, tokenVar: 'OPTIMIZELY_PUBLISH_TOKEN' },
  { name: 'webhook:delete', module: unpublishModule, tokenVar: 'FRONTEND_PUBLISH_TOKEN' }
])('$name command publish token handling', ({ name, module, tokenVar }) => {
  let output: string[]
  let previousEnv: Record<string, string | undefined>

  beforeEach(() => {
    previousEnv = {}
    ENV_KEYS.forEach(key => {
      previousEnv[key] = process.env[key]
      delete process.env[key]
    })
    process.env[tokenVar] = PUBLISH_TOKEN
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
    expect(text).toContain('Publishing token')
    expect(text).not.toContain(PUBLISH_TOKEN)
    expect(text).not.toContain(PUBLISH_TOKEN.substring(0, 8))
    expect(text).toContain(`${PUBLISH_TOKEN.substring(0, 4)}********`)
  }

  function createApp() {
    return createCliApp('test-cli', '0.0.0').exitProcess(false).command(module as never)
  }

  it('does not print the publish token in --help output', async () => {
    await createApp().parse([name, '--help'])
    expectMasked()
  })

  it('does not print the publish token in the usage error output', async () => {
    // The Optimizely Graph credentials are unset, so the command fails its usage validation
    await createApp().parse([name])
    expectMasked()
  })
})
