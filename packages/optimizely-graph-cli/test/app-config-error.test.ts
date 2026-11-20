import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@remkoj/optimizely-graph-client/config', () => ({
  readEnvironmentVariables: () => { throw new Error('Invalid configuration') }
}))

import { createCliApp } from '../src/app'

describe('createCliApp configuration errors', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reports the configuration error and exits', () => {
    const errors: string[] = []
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { errors.push(args.map(String).join(' ')) })
    vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit') }) as never)

    expect(() => createCliApp('test-cli', '0.0.0')).toThrow('exit')
    expect(errors.join('\n')).toContain('Error')
    expect(errors.join('\n')).not.toContain('Included environment files')
  })
})
