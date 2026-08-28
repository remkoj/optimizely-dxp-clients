import { createClient } from '@hey-api/openapi-ts'

import { globSync as glob } from 'glob'
import { config } from 'dotenv'
import { expand } from 'dotenv-expand'
import path from 'node:path'
import fs from 'node:fs'

// CONSTANTS
const CMS_PATHS = {
  apiSpec: 'docs/content-openapi.json',
  info: 'docs/info',
  token: 'oauth/token'
}

/**
 * Entry point: loads the local environment, authenticates against the CMS,
 * downloads the OpenAPI specification and generates the typed API client into
 * `src/client`, then records the targeted CMS instance version in
 * `src/version.json`.
 *
 * @returns {Promise<void>}
 */
;(async function main() {
  // Prepare context
  loadDotEnvFiles()
  const accessToken = await getAccessToken();

  //Create client
  const input = await readOpenApiSpec(accessToken);
  const plugins = createPluginConfig();
  const output = createOutputConfig(path.resolve(path.join(process.cwd(), 'src', 'client')));

  process.stdout.write(`➡ Creating Optimizely CMS API Client\n`);
  void await createClient({ input, output, plugins });

  process.stdout.write(`⚓ Tracking CMS instance version\n`);
  void await createVersionFile(accessToken);
  process.stdout.write(`🏁 Done\n`);
})()

/**
 * Builds the `@hey-api/openapi-ts` plugin list that configures the generated
 * client: the fetch transport (with runtime config), date/BigInt transformers,
 * TypeScript types/enums and the SDK layer.
 *
 * @returns {Array<object>} The ordered plugin configuration.
 */
function createPluginConfig()
{
  return [
    {
      name: '@hey-api/client-fetch',
      bundle: true,
      exportFromIndex: true,
      throwOnError: false,
      runtimeConfigPath: './src/client-config',
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

/**
 * Builds the generator output configuration: the destination folder is cleaned
 * before writing, files use camelCase naming and the package `tsconfig.json` is
 * used for type resolution.
 *
 * @param {string} destFolder Absolute path the client is written to.
 * @returns {object} The output configuration for `createClient`.
 */
function createOutputConfig(destFolder)
{
  return {
    clean: true,
    case: 'camelCase',
    path: destFolder,

    tsConfigPath: path.resolve(path.join(process.cwd(), 'tsconfig.json')),
  }
}

/**
 * Performs an OAuth client-credentials exchange against the CMS token endpoint
 * using `OPTIMIZELY_CMS_CLIENT_ID`/`OPTIMIZELY_CMS_CLIENT_SECRET` from the
 * environment.
 *
 * @returns {Promise<string>} The `Authorization` header value (`"<type> <token>"`).
 * @throws {Error} When the token endpoint returns a non-OK response.
 */
async function getAccessToken() {
  const authUrl = buildApiEndpoint(CMS_PATHS.token, true);
  const clientId = process.env.OPTIMIZELY_CMS_CLIENT_ID || '';
  const clientSecret = process.env.OPTIMIZELY_CMS_CLIENT_SECRET || '';

  const headers = new Headers()
  headers.append('Authorization', `Basic ${Buffer.from(`${clientId ?? ''}:${clientSecret ?? ''}`).toString('base64')}`);
  headers.append('Content-Type', 'application/x-www-form-urlencoded');
  headers.append('Connection', 'close');

  console.log(`⚪ [CMS API] Using authentication endpoint: ${authUrl}`);
  console.log(`⚪ [CMS API] Retrieving new credentials for ${clientId}`);

  const body = new URLSearchParams()
  body.append("grant_type", "client_credentials")

  const httpResponse = await fetch(authUrl, {
    method: "POST",
    headers: headers,
    body: body.toString(),
    cache: "no-store"
  })
  const response = await httpResponse.json()

  if (!httpResponse.ok)
    throw new Error("Authentication error: " + response.error_description, { cause: httpResponse })

  console.log(`⚪ [CMS API] Authenticated as: ${clientId ?? '-'}`)
  return `${response.token_type} ${response.access_token}`;
}

/**
 * Fetches the CMS OpenAPI specification as JSON, authenticating with the given
 * token (or acquiring one if none is supplied).
 *
 * @param {string} [token] Authorization header value; obtained via {@link getAccessToken} when omitted.
 * @param {typeof buildApiEndpoint} [endpointBuilder] Endpoint builder, overridable for testing.
 * @returns {Promise<object>} The parsed OpenAPI specification.
 * @throws {Error} When the spec endpoint returns a non-OK response.
 */
async function readOpenApiSpec(token, endpointBuilder = buildApiEndpoint) {
  const accessToken = token || await getAccessToken();
  const specUrl = endpointBuilder(CMS_PATHS.apiSpec);

  console.log(`⚪ [CMS API] Using OpenAPI Spec endpoint: ${specUrl}`);
  const httpResponse = await fetch(specUrl, {
    headers: {
      accept: "application/json",
      authorization: accessToken
    }
  })

  if (!httpResponse.ok)
    throw new Error(`Unable to read the OpenAPI Specification: HTTP ${ httpResponse.status } ${ httpResponse.statusText   }`, { cause: httpResponse })

  const specData = await httpResponse.json();
  console.log(`⚪ [CMS API] Loaded OpenAPI Specification`)
  return specData;
}

/**
 * Resolves the CMS instance version info and writes it to `src/version.json`.
 *
 * @param {string} [token] Authorization header value passed through to {@link getVersionInfo}.
 * @returns {Promise<void>}
 */
async function createVersionFile(token) {
  const versionInfo = await getVersionInfo(token);
  const versionFile = path.resolve(
    path.join(process.cwd(), 'src', 'version.json')
  )
  fs.writeFileSync(versionFile, JSON.stringify(versionInfo, undefined, 4))
  console.log(` - Written version info to ${versionFile}`)
}

/**
 * Determines the API/service/CMS version information. For `preview` API
 * versions the live `docs/info` endpoint is queried; otherwise the resolved
 * {@link getApiVersion} is reported and service/CMS are `'unknown'`. The
 * resolved {@link getApiBaseUrl} is always included, so the generated client
 * can be traced back to the gateway it was built against.
 *
 * @param {string} [token] Authorization header value; obtained via {@link getAccessToken} when omitted.
 * @returns {Promise<{api: string, service: string, cms: string, baseUrl: string}>} The version descriptor.
 * @throws {Error} When the info endpoint returns a non-OK response.
 */
async function getVersionInfo(token) {
  const apiVersion = getApiVersion();
  const baseUrl = getApiBaseUrl();
  if (apiVersion.includes('preview')) {
    const infoEndpoint = buildApiEndpoint(CMS_PATHS.info);
    const accessToken = token || await getAccessToken();
    console.log(` - Reading CMS version information from: ${infoEndpoint}`);
    const response = await fetch(infoEndpoint, {
      headers: {
        accept: "application/json",
        authorization: accessToken
      }
    });
    if (!response.ok) {
      throw new Error(
        `HTTP Error while reading version: ${response.status} ${response.statusText}`,
        { cause: response }
      )
    }
    const body = await response.json()
    return {
      api: body.apiVersion,
      service: body.serviceVersion?.split('+')[0],
      cms: body.cmsVersion?.split('+')[0],
      baseUrl,
    }
  } else  {
    return {
      api: apiVersion,
      service: 'unknown',
      cms: 'unknown',
      baseUrl,
    }
  }
}

/**
 * Loads the project `.env` files into `process.env` for client generation.
 * Files are matched by `NODE_ENV` (`.env`, `.env.<env>`, `.env.local`,
 * `.env.<env>.local`), applied shortest-name-first so more specific files
 * override, and variable expansion is performed.
 *
 * @returns {void}
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

/**
 * Resolves the API version segment used both to fetch the OpenAPI spec and to
 * record it in `src/version.json`, so the generated client always ends up
 * pinned to the version it was actually generated against.
 *
 * @returns {string} The `OPTIMIZELY_API_VERSION` value, or `'v1'` when unset.
 */
function getApiVersion() {
  return process.env.OPTIMIZELY_API_VERSION || 'v1';
}

/**
 * Resolves the API base URL used both to fetch the OpenAPI spec and to record
 * in `src/version.json` — the same variable `src/config.ts` resolves at
 * runtime, so `generate` targets whichever gateway the generated client will
 * talk to. Always carries a trailing slash so relative paths append rather
 * than replace.
 *
 * @returns {string} The `OPTIMIZELY_CMS_API_BASEURL` value, or the production
 * gateway when unset.
 */
function getApiBaseUrl() {
  const rawBaseUrl = process.env.OPTIMIZELY_CMS_API_BASEURL || 'https://api.cms.optimizely.com/';
  return rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`;
}

/**
 * Constructs an absolute CMS API URL from {@link getApiBaseUrl} and, unless
 * omitted, the {@link getApiVersion} prefix.
 *
 * @param {string} [path] Path relative to the API base (and version) URL.
 * @param {boolean} [omitVersion] When true, the version prefix is left off (e.g. for the token endpoint).
 * @returns {URL} The resolved endpoint URL.
 * @throws {Error} When the resulting URL is invalid.
 */
function buildApiEndpoint(path = '', omitVersion = false) {
  const requestPath = omitVersion ? path : `${getApiVersion()}/${path}`;
  try {
    return new URL(requestPath, getApiBaseUrl())
  } catch (e) {
    throw new Error(
      'Unable to construct the Optimizely CMS endpoint URL, please check your environment configuration',
      { cause: e }
    )
  }
}
