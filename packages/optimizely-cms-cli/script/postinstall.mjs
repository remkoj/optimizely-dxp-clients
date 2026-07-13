#!/usr/bin/env node
/**
 * Post-install hook: runs `opti-cms project:ai` in the consumer project so
 * that AI assistant configuration files (AGENTS.md, CLAUDE.md, VS Code Copilot
 * instruction files, Cursor rules) are created or updated automatically after
 * each install or upgrade.
 *
 * Any failure is silenced and exits 0 so it never blocks `npm install` /
 * `yarn install`.
 */
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const cliEntry = path.resolve(scriptDir, '..', 'dist', 'index.js')

// npm and Yarn 4 both set INIT_CWD to the directory where the install was
// invoked, which is the consumer project root.
const projectPath = process.env.INIT_CWD ?? process.cwd()

try {
  execFileSync(process.execPath, [cliEntry, 'project:ai', '--path', projectPath], {
    // Show stdout (progress ticks) but suppress stderr so transient errors
    // (e.g. missing env vars) do not pollute the install output.
    stdio: ['ignore', 'inherit', 'ignore'],
    env: {
      ...process.env,
      // project:ai does not use CMS credentials, but the global CLI argument
      // parser demands them via yargs when the environment variables are absent.
      // Provide placeholder values to satisfy the demand check without altering
      // any real configuration.
      OPTIMIZELY_CMS_URL:
        process.env.OPTIMIZELY_CMS_URL || 'https://placeholder.example.com',
      OPTIMIZELY_CMS_CLIENT_ID: process.env.OPTIMIZELY_CMS_CLIENT_ID || 'placeholder',
      OPTIMIZELY_CMS_CLIENT_SECRET: process.env.OPTIMIZELY_CMS_CLIENT_SECRET || 'placeholder',
    },
  })
} catch {
  // Silently ignore any failure:
  //   - dist/ not yet built (fresh clone, pre-prepare)
  //   - No @remkoj packages discovered in the target project
  //   - Unsupported Node version or environment
  //   - Any other non-zero exit from the CLI
}
