import { globSync as glob } from 'glob'
import dotenv from 'dotenv'
import { expand } from 'dotenv-expand'
import path from 'node:path'
import fs from 'node:fs'

export function getProjectDir() : string
{
  let testPath = process.cwd();
  let hasPackageJson = false;
  do {
    hasPackageJson = fs.statSync(path.join(testPath, 'package.json'), {throwIfNoEntry: false})?.isFile() ?? false;
    if (!hasPackageJson)
      testPath = path.normalize(path.join(testPath,'..'));
  } while (!hasPackageJson && testPath.length > 2);

  if (!hasPackageJson) {
    throw new Error('No package.json found!')
  }

  return testPath
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
  expand(dotenv.config({ 
    path: envFiles.map(envFile => path.join(projectDir, envFile)), 
    debug: false, 
    quiet: true 
  }));
  return envFiles;
}

export default prepare
