import { createClient, defaultPlugins } from '@hey-api/openapi-ts'

import { globSync as glob } from 'glob'
import { config } from 'dotenv'
import { expand } from 'dotenv-expand'
import path from 'node:path'
import fs from 'node:fs'

// CONSTANTS
const CMS_PATHS = {
  apiSpec: 'docs/content-openapi.json',
  info: 'info',
  token: 'oauth/token'
}

// Main script file
;(async function main() {
  // Prepare context
  loadDotEnvFiles()
  const accessToken = await getAccessToken();

  //Create client
  const openApiSpecV3 = await readOpenApiSpec(accessToken);
  const openApiSpecV2 = await readOpenApiSpec(accessToken, buildCmsEndpoint);
  const plugins = createPluginConfig();

  process.stdout.write(`➡ Creating Preview3 & Preview2 CMS API Client\n`);
  await Promise.allSettled(
    [
      createClient({
        input: openApiSpecV3,
        output: createOutputConfig(path.resolve(path.join(process.cwd(), 'src', 'client'))),
        plugins,
      }),
      createClient({
        input: openApiSpecV2,
        output: createOutputConfig(path.resolve(path.join(process.cwd(), 'src', 'instance.client'))),
        plugins,
      })
    ]
  )

  process.stdout.write(`⚓ Tracking CMS instance version\n`);
  await createVersionFile(accessToken);
  process.stdout.write(`🏁 Done\n`);
})()

function createPluginConfig()
{
  return [
    ...defaultPlugins,
    {
      name: '@hey-api/client-fetch',
      bundle: true,
      exportFromIndex: true,
      throwOnError: false,
      runtimeConfigPath: '../client-config',
    },
    {
      name: '@hey-api/transformers',
      dates: true,
      bigInt: true,
      exportFromIndex: true,
    },
    {
      name: '@hey-api/typescript',
      enums: 'typescript+namespace',
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
  ]
}

function createOutputConfig(destFolder)
{
  return {
      clean: true,
      case: 'camelCase',
      path: destFolder,
      tsConfigPath: path.resolve(path.join(process.cwd(), 'tsconfig.json')),
    }
}

async function getAccessToken() {
  const authUrl = buildApiEndpoint(CMS_PATHS.token, true);
  const clientId = process.env.OPTIMIZELY_CMS_CLIENT_ID || '';
  const clientSecret = process.env.OPTIMIZELY_CMS_CLIENT_SECRET || '';
  const actAs = process.env.OPTIMIZELY_CMS_USER_ID || undefined;

  const headers = new Headers()
  headers.append('Authorization', `Basic ${Buffer.from(`${clientId ?? ''}:${clientSecret ?? ''}`).toString('base64')}`);
  headers.append('Content-Type', 'application/x-www-form-urlencoded');
  headers.append('Connection', 'close');

  console.log(`⚪ [CMS API] Using authentication endpoint: ${authUrl}`);
  console.log(`⚪ [CMS API] Retrieving new credentials for ${clientId}${actAs ? ", acting as " + actAs : ""}`);

  const body = new URLSearchParams()
  body.append("grant_type", "client_credentials")
  if (actAs)
    body.append("act_as", actAs)

  const httpResponse = await fetch(authUrl, {
    method: "POST",
    headers: headers,
    body: body.toString(),
    cache: "no-store"
  })
  const response = await httpResponse.json()

  if (!httpResponse.ok)
    throw new Error("Authentication error: " + response.error_description)

  console.log(`⚪ [CMS API] Authenticated as: ${actAs ?? clientId ?? '-'}`)

  return response.access_token
}


async function readOpenApiSpec(token, endpointBuilder = buildApiEndpoint) {
  const accessToken = token || await getAccessToken();
  const specUrl = endpointBuilder(CMS_PATHS.apiSpec);

  console.log(`⚪ [CMS API] Using OpenAPI Spec endpoint: ${specUrl}`);
  const httpResponse = await fetch(specUrl, {
    headers: {
      accept: "application/json",
      authorization: "Bearer " + accessToken
    }
  })

  if (!httpResponse.ok)
    throw new Error("Unable to read the OpenAPI Specification")

  const specData = await httpResponse.json();
  console.log(`⚪ [CMS API] Loaded OpenAPI Specification`)
  return specData;
}

async function createVersionFile(token) {
  const infoEndpoint = buildApiEndpoint(CMS_PATHS.info);
  const accessToken = token || await getAccessToken();
  console.log(` - Reading CMS version information from: ${infoEndpoint}`);
  const response = await fetch(infoEndpoint, {
    headers: {
      accept: "application/json",
      authorization: "Bearer " + accessToken
    }
  });
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
      debug: false,
      quiet: true
    })
  )
  envFiles.forEach((x) => {
    process.stdout.write(` - Processed: ${x}\n`)
  })
}

function buildApiEndpoint(path = '', omitVersion = false) {
  const cmsURL = process.env.OPTIMIZELY_CMS_API_URL || 'https://api.cms.optimizely.com/';
  const cmsVersion = process.env.OPTIMIZELY_API_VERSION || 'preview3';
  const requestPath = omitVersion ? path : `${cmsVersion}/${path}`;
  try {
    return new URL(requestPath, cmsURL)
  } catch (e) {
    throw new Error(
      'Unable to construct the Optimizely CMS endpoint URL, please check your environment configuration'
    )
  }
}

/**
 * 
 * @param {string} path 
 * @param {string|false|undefined|null} pinnedVersion The version of the CMS API, set to an empty string to omit
 * @returns 
 */
function buildCmsEndpoint(path = '', pinnedVersion = false) {
  const cmsURL = process.env.OPTIMIZELY_CMS_URL || 'https://api.cms.optimizely.com/';
  const cmsVersion = pinnedVersion || process.env.OPTIMIZELY_CMS_API_VERSION || 'preview2';
  const requestPath =  cmsVersion && cmsVersion.length > 0 ? `_cms/${cmsVersion}/${path}` :  `_cms/${path}`;
  try {
    return new URL(requestPath, cmsURL)
  } catch (e) {
    throw new Error(
      'Unable to construct the Optimizely CMS endpoint URL, please check your environment configuration'
    )
  }
}
