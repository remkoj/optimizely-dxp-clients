import { globSync as glob } from 'glob'
import dotenv from 'dotenv'
import { expand } from 'dotenv-expand'

export function buildEnvironment(): Array<string> {
  const envFiles = glob(".env*").sort((a, b) => b.length - a.length).filter(n => n == ".env" || n == ".env.local" || (process.env.NODE_ENV && n == `.env.${process.env.NODE_ENV}.local`));
  expand(dotenv.config({ path: envFiles, debug: false, quiet: true }));
  return envFiles;
}

export default buildEnvironment