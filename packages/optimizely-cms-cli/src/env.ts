import { globSync as glob } from 'glob'
import { config } from 'dotenv'
import { expand } from 'dotenv-expand'
import path from 'node:path'
import fs from 'node:fs'

export function getProjectDir() : string
{
  let testPath = process.cwd();
  do {
    if (fs.statSync(path.join(testPath, 'package.json'), {throwIfNoEntry: false})?.isFile())
      return testPath;
    testPath = path.normalize(path.join(testPath, '..'));
  } while (testPath.length > 2);

  throw new Error('No package.json found!')
}

/**
 * Prepare the application context, by parsing the .env files in the main
 * application directory.
 * 
 * @returns     A string array with the files processed
 */
export function prepare(pDir?: string): string[] {
  const projectDir = pDir ?? getProjectDir();
  const envFiles = glob(".env*", { cwd: projectDir })
    .sort((a, b) => b.length - a.length)
    .filter(n => n == ".env" || n == ".env.local" || (process.env.NODE_ENV && n == `.env.${process.env.NODE_ENV}.local`));
  expand(config({ path: envFiles, debug: false, quiet: true }));
  return envFiles;
}

export default prepare
