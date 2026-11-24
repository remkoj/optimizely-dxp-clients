import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { NextJsComponentsCommand } from '../src/commands/nextjs_components'

const experience = {
  key: 'LandingExperience',
  displayName: 'Landing Experience',
  description: 'An experience',
  baseType: '_experience'
}

describe('nextjs:components', () => {
  let workDir: string

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 'cms-cli-components-'))
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    rmSync(workDir, { recursive: true, force: true })
  })

  const generate = () => {
    return NextJsComponentsCommand.handler({
      _: [], $0: 'opti-cms', path: workDir, components: 'components', force: true
    } as never, {
      loadedContentTypes: { contentTypes: [experience] }
    } as never)
  }

  const readExperience = () => {
    const file = join(workDir, 'components', 'experience', 'landing-experience', 'index.tsx')
    return readFileSync(file).toString()
  }

  it('generates an Experience that uses the setter to flag the context', async () => {
    await generate()
    const source = readExperience()
    expect(source).toContain('(ctx as ServerContext).setEditableContentIsExperience(true)')
    expect(source).toContain('type ServerContext')
  })

  it('does not assign editableContentIsExperience directly in the generated Experience', async () => {
    await generate()
    expect(readExperience()).not.toMatch(/\.editableContentIsExperience\s*=/)
  })
})
