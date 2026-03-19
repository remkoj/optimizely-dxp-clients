import figures from 'figures'
import { glob } from 'glob'
import path from 'node:path'
import fs from 'node:fs/promises'

import { parseArgs } from '../tools/parseArgs.js'
import { keyToSlug } from '../tools/project.js'
import { NextJsFactoryCommand } from './nextjs_factories.js'
import { type NextJsModule, builder } from './_nextjs_base.js'

type MigrateModule = NextJsModule<{}>

export const MigrateCommand: MigrateModule = {
  command: "project:migrate",
  describe: "Automate the directory naming convention update",
  builder,
  async handler(args, opts) {
    const { components: componentsPath, _config: { debug } } = parseArgs(args);
    const files = await glob(['*/**/*'], { cwd: componentsPath })
    const operations: Array<{ from: string, to: string }> = [];
    for (const file of files) {
      const fullPath = path.join(componentsPath, file);
      const pathInfo = await fs.stat(fullPath);
      if (pathInfo.isDirectory()) { // We only need to rename directories
        const dirName = path.basename(fullPath);
        const dirParent = path.dirname(fullPath);
        const newDirName = keyToSlug(dirName);
        // We're ignoring casing as changing that will confuse Git
        if (dirName.toLowerCase() !== newDirName.toLowerCase()) {
          process.stdout.write(`${ figures.arrowRight } Updating ${ file }\n`);
          const newFullPath = path.join(dirParent, newDirName);
          operations.push({ from: fullPath, to: newFullPath });
        }
      }
      if (pathInfo.isFile() && (fullPath.endsWith('.opti-style.json') || fullPath.endsWith('.opti-type.json'))) {
        const fileName = path.basename(fullPath);
        const newFileName = keyToSlug(fileName, { preserveCharacters: ['.'] });
        if (fileName.toLowerCase() !== newFileName.toLowerCase()) {
          const filePath = path.dirname(fullPath);
          const newFullPath = path.join(filePath, newFileName);
          operations.unshift({ from: fullPath, to: newFullPath });
        }
      }
    }

    

    for (const operation of operations) {
      void await fs.rename(operation.from, operation.to);
    }

    NextJsFactoryCommand.handler(args)
  }
}

export default MigrateCommand;
