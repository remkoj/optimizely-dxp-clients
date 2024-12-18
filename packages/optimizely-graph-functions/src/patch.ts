import fs from "node:fs"
import path from "node:path"
import posix from "node:path/posix"
import { Readable } from "node:stream"
import { finished } from "node:stream/promises"

const downloadLink = "https://github.com/remkoj/optimizely-dxp-clients/raw/refs/heads/main/dependencies/graphql-codegen-visitor-plugin-common-v5.6.0-patched.tgz"
const downloadFile = "graphql-codegen-visitor-plugin-common-v5.6.0-patched.tgz"
const downloadPath = "./packages"

const packageJsonPath = path.join(process.cwd(), 'package.json')
if (!fs.existsSync(packageJsonPath))
{
    process.exit(0)
}

const packageData = JSON.parse(fs.readFileSync(packageJsonPath).toString())
const packageName = packageData.name ?? path.basename(process.cwd())

console.log("🚀 [Optimizely Graph Functions] Enabling recursive query support for project: "+packageName)

const downloadDir = path.normalize(path.join(process.cwd(), downloadPath))
fetch(downloadLink).then(response => {
    if (!response.ok || !response.body)
        return
    
    fs.mkdirSync(downloadDir, { recursive: true })
    const downloadTarget = path.join(downloadDir, downloadFile)
    
    console.log("🚀 [Optimizely Graph Functions] Downloading patched visitor-plugin-common from GitHub")
    finished(Readable.fromWeb(response.body as Parameters<typeof Readable['fromWeb']>[0]).pipe(fs.createWriteStream(downloadTarget, { flags: 'w' }))).then(() => {
        console.log("🚀 [Optimizely Graph Functions] Downloaded patched visitor-plugin-common")

        packageData.resolutions = packageData.resolutions || {}
        const importPath = 'file:./' + posix.normalize(posix.join(downloadPath, downloadFile))
        if (packageData.resolutions["@graphql-codegen/visitor-plugin-common"] != importPath) {
            packageData.resolutions["@graphql-codegen/visitor-plugin-common"] = importPath
            const updatedPackageData = JSON.stringify(packageData, undefined, 2)
            fs.writeFileSync(packageJsonPath, updatedPackageData, { flag: 'w' })
            console.log("🚀 [Optimizely Graph Functions] Applied resolution to project "+packageName)
        } else { 
            console.log("🚀 [Optimizely Graph Functions] Resolution already exists "+packageName)
        }
    })
})