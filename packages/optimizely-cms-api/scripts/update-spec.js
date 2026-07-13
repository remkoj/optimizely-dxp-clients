const { globSync: glob } = require('glob')
const { config } = require('dotenv')
const path = require('node:path')
const fs = require('node:fs')

const CMS_PATHS = {
    apiSpec: '/docs/content-openapi.json',
    info: '/info',
    token: '/oauth/token'
}

async function main() {
  loadDotEnvFiles()
  const access_token = await getAuthentication();
  void await createVersionFile(access_token).catch(e => console.error("Error while creating version file: ", e));
  void await createSchemaFile(access_token);
}

// Run in Async Context
main();

async function createSchemaFile(token)
{
    const infoEndpoint = buildApiEndpoint(CMS_PATHS.apiSpec)
    console.log(`Reading API specification from: ${ infoEndpoint }`)
    const response = await fetch(infoEndpoint, {
      method: 'get',
      headers: {
        Authorization: token ?? ''
      }
    })
    if (!response.ok) {
        throw new Error(`HTTP Error while reading version: ${ response.status } ${ response.statusText }`)
    }
    const body = await response.json()
    
    const schemaFile = path.resolve(path.join(process.cwd(), 'integrationapi.spec.json'))
    fs.writeFileSync(schemaFile, JSON.stringify(body, undefined, 4))
    console.log(`Written API Spec to ${ schemaFile }`)
}

async function createVersionFile(token)
{
    const infoEndpoint = buildApiEndpoint(CMS_PATHS.info)
    console.log(`Reading CMS version information from: ${ infoEndpoint }`)
    const response = await fetch(infoEndpoint, {
      method: 'get',
      headers: {
        Authorization: token ?? ''
      }
    })

    if (!response.ok) {
      console.error(`HTTP Error while reading version: ${ response.status } ${ response.statusText }`);
      return;
      // throw new Error(`HTTP Error while reading version: ${ response.status } ${ response.statusText }`)
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

function buildApiEndpoint(path, omitVersion = false)
{
    const cmsURL = process.env.OPTIMIZELY_CMS_API_URL || "https://api.cms.optimizely.com";
    const cmsVersion = process.env.OPTIMIZELY_API_VERSION || "preview3";
    const requestPath = [trimSlashes(path)];
    if (!omitVersion) requestPath.unshift(trimSlashes(cmsVersion));
    try {
        return new URL('/'+requestPath.join('/'), cmsURL)
    } catch (e) {
        throw new Error("Unable to construct the Optimizely CMS endpoint URL, please check your environment configuration")
    }
}

/**
 * Remove leading and trailing slashes from a path segment. It will also
 * remove any duplicates, i.e. `//` will be replaced with `/`.
 * 
 * @param {string} slug The path fragment to process
 * @param {string} char The character to trim and deduplicate
 * @returns {string} The processed string
 */
function trimSlashes(slug, char = '/') {
  return slug.split(char).filter(x => x).join('/');
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

/**
 * Connect to the CMS API Endpoint and retrieve the access token
 * 
 * @returns {Promise<string>} The value for the authentication header
 */
async function getAuthentication() {
  const authUrl = buildApiEndpoint(CMS_PATHS.token, true);
  const clientId = process.env.OPTIMIZELY_CMS_CLIENT_ID || '';
  const clientSecret = process.env.OPTIMIZELY_CMS_CLIENT_SECRET || '';
  const actAs = /* process.env.OPTIMIZELY_CMS_USER_ID ||*/ undefined;

  const headers = new Headers()
  headers.append('Authorization', `Basic ${Buffer.from(`${clientId ?? ''}:${clientSecret ?? ''}`).toString('base64')}`);
  headers.append('Content-Type', 'application/x-www-form-urlencoded');
  headers.append('Connection', 'close');

  console.log(`⚪ [CMS API] Using authentication endpoint: ${authUrl}`);
  console.log(`⚪ [CMS API] Retrieving new credentials for ${clientId}${actAs ? ", acting as " + actAs : ""}`);

  const body = new URLSearchParams()
  body.append("grant_type", "client_credentials")
  // if (actAs)
  //  body.append("act_as", actAs)

  const httpResponse = await fetch(authUrl, {
    method: "POST",
    headers: headers,
    body: body.toString(),
    cache: "no-store"
  })
  const response = await httpResponse.json()

  if (!httpResponse.ok) {
    throw new Error(`HTTP ${ httpResponse.status } ${ httpResponse.statusText } => Authentication error: ${ response.error_description ?? response.detail }`)
  }

  console.log(`⚪ [CMS API] Authenticated as: ${actAs ?? clientId ?? '-'}`)

  return response.token_type + ' ' + response.access_token
}
