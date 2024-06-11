const { globSync: glob } = require('glob')
const { config } = require ('dotenv')
const path = require('node:path')
const fs = require('node:fs')

const CMS_PATHS = {
    apiSpec: '/docs/content-openapi.json',
    info: '/info'
}

loadDotEnvFiles()
createVersionFile()
createSchemaFile()

async function createSchemaFile()
{
    const infoEndpoint = buildCmsEndpoint(CMS_PATHS.apiSpec)
    const response = await fetch(infoEndpoint)
    if (!response.ok) {
        throw new Error(`HTTP Error while reading version: ${ response.status } ${ response.statusText }`)
    }
    const body = await response.json()
    
    const schemaFile = path.resolve(path.join(process.cwd(), 'integrationapi.spec.json'))
    fs.writeFileSync(schemaFile, JSON.stringify(body, undefined, 4))
    console.log(`Written API Spec to ${ schemaFile }`)
}

async function createVersionFile()
{
    const infoEndpoint = buildCmsEndpoint(CMS_PATHS.info)
    const response = await fetch(infoEndpoint)
    if (!response.ok) {
        throw new Error(`HTTP Error while reading version: ${ response.status } ${ response.statusText }`)
    }
    const body = await response.json()
    const versionInfo = {
        api: body.apiVersion,
        service: body.serviceVersion?.split('+')[0],
        cms: body.cmsVersion?.split('+')[0]
    }
    
    const versionFile = path.resolve(path.join(process.cwd(), 'src', 'version.json'))
    fs.writeFileSync(versionFile, JSON.stringify(versionInfo, undefined, 4))
    console.log(`Written version info to ${ versionFile }`)
}

function buildCmsEndpoint(path)
{
    const cmsURL = process.env.OPTIMIZELY_CMS_URL
    const cmsVersion = process.env.OPTIMIZELY_API_VERSION
    const requestPath = `/_cms/${ cmsVersion }${ path }`
    try {
        return new URL(requestPath, cmsURL)
    } catch (e) {
        throw new Error("Unable to construct the Optimizely CMS endpoint URL, please check your environment configuration")
    }
}

function loadDotEnvFiles() 
{
    const env = process.env.NODE_ENV ?? 'development'
    const envFilePattern = new RegExp(`\\.env(\\.${ env }){0,1}(\\.local){0,1}$`)
    const envFiles = glob(".env*").filter(path => path.match(envFilePattern)).sort((a, b) => a.length - b.length)
    config({
        path: envFiles,
        override: true
    })
}