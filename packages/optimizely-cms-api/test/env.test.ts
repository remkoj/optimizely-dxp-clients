import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { config } from 'dotenv'
import { expand } from 'dotenv-expand'

const TEST_KEYS = ['DXP_TEST_BASE', 'DXP_TEST_EXPANDED', 'DXP_TEST_COMMAND']

// Mirrors loadDotEnvFiles() in scripts/create-client.mjs, which runs on import
// and therefore cannot be imported on its own.
function loadDotEnvFiles(): void {
  expand(config({ path: ['.env'], override: true, debug: false, quiet: true }))
}

describe('.env loading for client generation', () => {
  let originalCwd: string
  let workDir: string

  beforeEach(() => {
    originalCwd = process.cwd()
    workDir = mkdtempSync(join(tmpdir(), 'cms-api-env-'))
    process.chdir(workDir)
  })

  afterEach(() => {
    process.chdir(originalCwd)
    rmSync(workDir, { recursive: true, force: true })
    TEST_KEYS.forEach(key => delete process.env[key])
  })

  it('expands variable references from .env files', () => {
    writeFileSync('.env', 'DXP_TEST_BASE=hello\nDXP_TEST_EXPANDED=${DXP_TEST_BASE}-world\n')

    loadDotEnvFiles()

    expect(process.env.DXP_TEST_EXPANDED).toBe('hello-world')
  })

  it('does not execute command substitutions from .env files', () => {
    const marker = join(workDir, 'pwned.txt')
    writeFileSync('.env', `DXP_TEST_COMMAND=$(echo pwned > "${marker}"; echo x)\n`)

    loadDotEnvFiles()

    expect(existsSync(marker)).toBe(false)
  })
})
