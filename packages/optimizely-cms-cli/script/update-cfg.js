import path from 'node:path'
import fs from 'node:fs'

const cwd = process.cwd()

const pkgFile = path.normalize(path.join(cwd, './package.json'))
if (!fs.existsSync(pkgFile))
    throw new Error("Package descriptor not found!")
const pkgData = JSON.parse(fs.readFileSync(pkgFile))

const scriptVersion = pkgData.version ?? "development"
const scriptEntries = pkgData.bin ?? {}
const scriptName = Object.getOwnPropertyNames(scriptEntries)[0] ?? 'opti-cms-dev'

const infoFile = path.normalize(path.join(cwd, './src/version.json'))
fs.writeFileSync(infoFile, JSON.stringify({
    version: scriptVersion,
    name: scriptName
}))
