import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const client = {
  displayTemplatesPatch: vi.fn(),
  displayTemplatesCreate: vi.fn()
}
let existing: Record<string, unknown>[] = []

vi.mock('../src/tools/cmsClient.js', () => ({ createCmsClient: () => client }))
vi.mock('../src/tools/styles.js', () => ({ getStyles: async () => ({ styles: existing }) }))

import { StylesPushCommand } from '../src/commands/styles_push'

describe('styles:push', () => {
  let workDir: string

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 'cms-cli-styles-'))
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    client.displayTemplatesPatch.mockReset()
    client.displayTemplatesCreate.mockReset()
    writeFileSync(join(workDir, 'a.opti-style.json'), JSON.stringify({ key: 'a', displayName: 'New name', isDefault: false }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    rmSync(workDir, { recursive: true, force: true })
  })

  const run = () => StylesPushCommand.handler({
    _: [], $0: 'opti-cms', path: workDir, components: '.', excludeTemplates: [], templates: []
  } as never)

  it('creates templates that do not exist yet', async () => {
    existing = []
    client.displayTemplatesCreate.mockResolvedValue({ key: 'a', displayName: 'New name', isDefault: false })
    await run()
    expect(client.displayTemplatesCreate).toHaveBeenCalledOnce()
    expect(client.displayTemplatesPatch).not.toHaveBeenCalled()
  })

  it('patches changed templates and skips unchanged ones', async () => {
    existing = [{ key: 'a', displayName: 'Old name', isDefault: false }]
    client.displayTemplatesPatch.mockResolvedValue({ key: 'a', displayName: 'New name', isDefault: false })
    await run()
    expect(client.displayTemplatesPatch).toHaveBeenCalledOnce()

    client.displayTemplatesPatch.mockReset()
    existing = [{ key: 'a', displayName: 'New name', isDefault: false }]
    await run()
    expect(client.displayTemplatesPatch).not.toHaveBeenCalled()
  })
})
