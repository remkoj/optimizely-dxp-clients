const { globSync } = require('glob')
const path = require('node:path')
const fs = require('node:fs')

process.stdout.write('Cleaning package folders\n')

process.stdout.write('\nRemoving TypeScript build info files\n')
const tsBuildInfoFiles = globSync(['./**/*.tsbuildinfo','./**/.tsbuildinfo'])
if (tsBuildInfoFiles.length > 0)
    tsBuildInfoFiles.forEach(infoFile => {
        const file = path.resolve(path.join(process.cwd(), infoFile))
        fs.rmSync(file)
        process.stdout.write(` - Removed ${ infoFile }\n`)
    })
else
    process.stdout.write(` - No TypeScript build info files found\n`)

process.stdout.write('\nRemoving build folders from within packages\n')
const buildFolders = globSync('./**/{build,dist,bin,.rollup.cache}/')
if (buildFolders.length > 0)
    buildFolders.forEach(folderPath => {
        const fullFolderPath = path.resolve(path.join(process.cwd(), folderPath))
        process.stdout.write(` - Removing folder ${ folderPath }`)
        fs.rmSync(fullFolderPath, { recursive: true })
        process.stdout.write(` - done\n`)
    })
else
    process.stdout.write(` - No build folders found\n`)