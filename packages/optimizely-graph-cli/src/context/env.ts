import { globSync as glob } from 'glob'
import dotenv from 'dotenv'
import { expand } from 'dotenv-expand'
import { EXPANDED_BY_CONFIG } from '@remkoj/optimizely-graph-client/config'

/**
 * Load the `.env` files from the current working directory into `process.env`,
 * expanding `${VAR}` references in the values. Variables that are expanded by the
 * Optimizely Graph configuration itself (the publish token and header) are loaded
 * as-is, so their values are expanded exactly once, an unresolved reference makes
 * the token unavailable instead of partial, and `\${VAR}` stays available as an
 * escape for literal text.
 *
 * @returns The `.env` files that have been loaded
 */
export function buildEnvironment(): Array<string> {
  const envFiles = glob(".env*").sort((a, b) => b.length - a.length).filter(n => n == ".env" || n == ".env.local" || (process.env.NODE_ENV && n == `.env.${process.env.NODE_ENV}.local`));
  const loaded = dotenv.config({ path: envFiles, debug: false, quiet: true })
  if (loaded.parsed) {
    const toExpand = { ...loaded.parsed }
    EXPANDED_BY_CONFIG.forEach(name => { delete toExpand[name] })
    expand({ ...loaded, parsed: toExpand })
  }
  return envFiles;
}

export default buildEnvironment
