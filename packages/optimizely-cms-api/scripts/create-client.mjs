import { createClient, defaultPlugins } from '@hey-api/openapi-ts'

import { globSync as glob } from 'glob'
import { config } from 'dotenv'
import { expand } from 'dotenv-expand'
import path from 'node:path'
import fs from 'node:fs'

// CONSTANTS
const CMS_PATHS = {
  apiSpec: '/docs/content-openapi.json',
  info: '/info',
}

// Main script file
;(async function main() {
  // Prepare context
  loadDotEnvFiles()

  //Create client
  await createClient({
    input: buildCmsEndpoint(CMS_PATHS.apiSpec).href,
    output: {
      clean: true,
      case: 'camelCase',
      path: path.resolve(path.join(process.cwd(), 'src', 'client')),
      tsConfigPath: path.resolve(path.join(process.cwd(), 'tsconfig.json')),
    },
    plugins: [
      ...defaultPlugins,
      {
        name: '@hey-api/client-fetch',
        bundle: true,
        exportFromIndex: true,
        throwOnError: false,
        runtimeConfigPath: './src/client-config.ts',
      },
      {
        dates: true,
        name: '@hey-api/transformers',
        bigInt: true,
        exportFromIndex: true,
      },
      {
        enums: 'javascript',
        name: '@hey-api/typescript',
        exportInlineEnums: true,
        identifierCase: 'preserve',
        exportFromIndex: true,
        readableNameBuilder: '{{name}}',
      },
      {
        name: '@hey-api/sdk',
        transformer: true,
        exportFromIndex: true,
        auth: false,
        client: '@hey-api/client-fetch',
      },
    ],
  })

  process.stdout.write(`⚓ Tracking CMS instance version\n`)
  await createVersionFile()
  process.stdout.write(`🏁 Done\n`)
})()

async function createVersionFile() {
  const infoEndpoint = buildCmsEndpoint(CMS_PATHS.info)
  console.log(` - Reading CMS version information from: ${infoEndpoint}`)
  const response = await fetch(infoEndpoint)
  if (!response.ok) {
    throw new Error(
      `HTTP Error while reading version: ${response.status} ${response.statusText}`
    )
  }
  const body = await response.json()
  const versionInfo = {
    api: body.apiVersion,
    service: body.serviceVersion?.split('+')[0],
    cms: body.cmsVersion?.split('+')[0],
  }

  const versionFile = path.resolve(
    path.join(process.cwd(), 'src', 'version.json')
  )
  fs.writeFileSync(versionFile, JSON.stringify(versionInfo, undefined, 4))
  console.log(` - Written version info to ${versionFile}`)
}

/**
 * Process environment files within this project used for generation of the API Client
 */
function loadDotEnvFiles() {
  process.stdout.write('⚪ Constructing runtime environment\n')
  const env = process.env.NODE_ENV ?? 'development'
  const envFilePattern = new RegExp(`\\.env(\\.${env}){0,1}(\\.local){0,1}$`)
  const envFiles = glob('.env*')
    .filter((path) => path.match(envFilePattern))
    .sort((a, b) => a.length - b.length)
  expand(
    config({
      path: envFiles,
      override: true,
    })
  )
  envFiles.forEach((x) => {
    process.stdout.write(` - Processed: ${x}\n`)
  })
}

function buildCmsEndpoint(path = '') {
  const cmsURL = process.env.OPTIMIZELY_CMS_URL
  const cmsVersion = process.env.OPTIMIZELY_API_VERSION
  const requestPath = `/_cms/${cmsVersion}${path}`
  try {
    return new URL(requestPath, cmsURL)
  } catch (e) {
    throw new Error(
      'Unable to construct the Optimizely CMS endpoint URL, please check your environment configuration'
    )
  }
}
