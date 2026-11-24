import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildEnvironment } from '../src/context/env'
import { readEnvironmentVariables } from '@remkoj/optimizely-graph-client/config'

const TEST_KEYS = ['DXP_TEST_BASE', 'DXP_TEST_EXPANDED', 'DXP_TEST_COMMAND']

describe('buildEnvironment', () => {
  let originalCwd: string
  let workDir: string

  beforeEach(() => {
    originalCwd = process.cwd()
    workDir = mkdtempSync(join(tmpdir(), 'graph-cli-env-'))
    process.chdir(workDir)
  })

  afterEach(() => {
    process.chdir(originalCwd)
    rmSync(workDir, { recursive: true, force: true })
    TEST_KEYS.forEach(key => delete process.env[key])
  })

  it('expands variable references from .env files', () => {
    writeFileSync('.env', 'DXP_TEST_BASE=hello\nDXP_TEST_EXPANDED=${DXP_TEST_BASE}-world\n')

    const files = buildEnvironment()

    expect(files).toEqual(['.env'])
    expect(process.env.DXP_TEST_EXPANDED).toBe('hello-world')
  })

  it('does not execute command substitutions from .env files', () => {
    const marker = join(workDir, 'pwned.txt')
    writeFileSync('.env', `DXP_TEST_COMMAND=$(echo pwned > "${marker}"; echo x)\n`)

    buildEnvironment()

    expect(existsSync(marker)).toBe(false)
  })
})

describe('buildEnvironment and the publish settings', () => {
  const PUBLISH_KEYS = ['OPTIMIZELY_PUBLISH_TOKEN', 'OPTIMIZELY_PUBLISH_HEADER', 'DXP_TEST_BASE', 'DXP_TEST_UNSET']
  let originalCwd: string
  let workDir: string
  let previousEnv: Record<string, string | undefined>

  beforeEach(() => {
    previousEnv = {}
    PUBLISH_KEYS.forEach(key => {
      previousEnv[key] = process.env[key]
      delete process.env[key]
    })
    originalCwd = process.cwd()
    workDir = mkdtempSync(join(tmpdir(), 'graph-cli-env-'))
    process.chdir(workDir)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    process.chdir(originalCwd)
    rmSync(workDir, { recursive: true, force: true })
    vi.restoreAllMocks()
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined)
        delete process.env[key]
      else
        process.env[key] = value
    }
  })

  it('leaves the expansion of the publish token to the configuration, so it is expanded once', () => {
    writeFileSync('.env', 'DXP_TEST_BASE=bypass-secret\nOPTIMIZELY_PUBLISH_TOKEN=${DXP_TEST_BASE}\n')
    buildEnvironment()
    expect(process.env.OPTIMIZELY_PUBLISH_TOKEN).toBe('${DXP_TEST_BASE}')
    expect(readEnvironmentVariables().publish).toBe('bypass-secret')
  })

  it('does not turn an unresolved reference into a partial publish token', () => {
    writeFileSync('.env', 'OPTIMIZELY_PUBLISH_TOKEN=prefix-${DXP_TEST_UNSET}\n')
    buildEnvironment()
    expect(readEnvironmentVariables().publish).toBeUndefined()
    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it('keeps an escaped literal in the publish token, without expanding it twice', () => {
    writeFileSync('.env', 'DXP_TEST_BASE=expanded\nOPTIMIZELY_PUBLISH_TOKEN=abc\\${DXP_TEST_BASE}\n')
    buildEnvironment()
    expect(readEnvironmentVariables().publish).toBe('abc${DXP_TEST_BASE}')
  })

  it('leaves the expansion of the publish header to the configuration', () => {
    writeFileSync('.env', 'DXP_TEST_BASE=x-vercel-protection-bypass\nOPTIMIZELY_PUBLISH_HEADER=${DXP_TEST_BASE}\n')
    buildEnvironment()
    expect(readEnvironmentVariables().publish_header).toBe('x-vercel-protection-bypass')
  })
})
