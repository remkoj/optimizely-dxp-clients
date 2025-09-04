import { globSync as glob } from 'glob'
import dotenv from 'dotenv'
import { expand } from 'dotenv-expand'

/**
 * Prepare the application context, by parsing the .env files in the main
 * application directory.
 * 
 * @returns     A string array with the files processed
 */
export function prepare(): string[] {
  const envFiles = glob(".env*").sort((a, b) => b.length - a.length).filter(n => n == ".env" || n == ".env.local" || (process.env.NODE_ENV && n == `.env.${process.env.NODE_ENV}.local`));
  expand(dotenv.config({ path: envFiles, debug: false, quiet: true }));
  return envFiles;
}

export default prepare