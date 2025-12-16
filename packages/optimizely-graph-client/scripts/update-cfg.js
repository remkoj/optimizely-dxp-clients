import path from 'node:path'
import fs from 'node:fs'

const cwd = process.cwd()

const pkgFile = path.normalize(path.join(cwd, './package.json'))
if (!fs.existsSync(pkgFile))
    throw new Error("Package descriptor not found!")
const pkgData = JSON.parse(fs.readFileSync(pkgFile))

const scriptVersion = pkgData.version ?? "development"

const infoFile = path.normalize(path.join(cwd, './src/version.ts'))
fs.writeFileSync(infoFile, `export default ${JSON.stringify({
    version: scriptVersion,
})}`)
