import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import patchPackagesModule from '../src/commands/patch'

class ExitSignal extends Error {}

describe('patches:apply project detection', () => {
  let workDir: string
  let output: string[]

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 'graph-cli-patch-'))
    output = []
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => { output.push(String(chunk)); return true })
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => { output.push(String(chunk)); return true })
    vi.spyOn(process, 'exit').mockImplementation((() => { throw new ExitSignal() }) as never)
    vi.spyOn(process, 'cwd').mockReturnValue(workDir)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    rmSync(workDir, { recursive: true, force: true })
  })

  const run = () => patchPackagesModule.handler({ _: [], $0: 'opti-graph', rootPath: '.', dryRun: true } as never)

  it('stops when the package.json is not valid JSON', async () => {
    writeFileSync(join(workDir, 'package.json'), '{ not json')
    await expect(run()).rejects.toBeInstanceOf(ExitSignal)
    expect(output.join('')).toContain('Unable to read')
  })

  it('continues to the patch lookup when the package.json is valid', async () => {
    writeFileSync(join(workDir, 'package.json'), JSON.stringify({ name: 'my-project' }))
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(run()).rejects.toBeInstanceOf(ExitSignal)
    const text = output.join('')
    expect(text).toContain('Adding/updating resolutions for: my-project')
    expect(text).toContain('Unable to get available patched packages')
  })
})
