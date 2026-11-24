# @remkoj/optimizely-graph-client — usage

> [!WARNING]
> This package is obsolete. Use Optimizely's official [`@optimizely/cms-sdk`](https://www.npmjs.com/package/@optimizely/cms-sdk) and [`@optimizely/cms-cli`](https://www.npmjs.com/package/@optimizely/cms-cli) packages instead.

GraphQL client and REST wrapper for Optimizely Graph (Content Graph).

## Install

```bash
npm install @remkoj/optimizely-graph-client
```

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `OPTIMIZELY_GRAPH_SINGLE_KEY` | yes | Read-only single key for public queries |
| `OPTIMIZELY_GRAPH_APP_KEY` | for mutations | Application key |
| `OPTIMIZELY_GRAPH_SECRET` | for mutations | Application secret |
| `OPTIMIZELY_PUBLISH_TOKEN` | no | Shared secret of the publish webhook. `${VAR}` references are expanded (e.g. `${VERCEL_AUTOMATION_BYPASS_SECRET}`); an unset reference results in no token |
| `OPTIMIZELY_PUBLISH_HEADER` | no | Header that carries the publish token (default `X-OPTLY-PUBLISH`; `x-vercel-protection-bypass` for Vercel Deployment Protection) |
| `OPTIMIZELY_GRAPH_GATEWAY` | no | Gateway URL (default: `https://cg.optimizely.com`) |
| `OPTIMIZELY_GRAPH_TENANT_ID` | no | Tenant identifier |
| `OPTIMIZELY_CMS_URL` | no | CMS instance URL |
| `OPTIMIZELY_DEBUG` | no | Set to `"1"` for debug logging |
| `OPTIMIZELY_GRAPH_QUERY_LOG` | no | Set to `"1"` to log all queries |

## Subpath exports

| Import path | Contents |
| --- | --- |
| `@remkoj/optimizely-graph-client` | `createClient()`, config helpers, services |
| `@remkoj/optimizely-graph-client/client` | `ContentGraphClient`, `IOptiGraphClient`, client types |
| `@remkoj/optimizely-graph-client/config` | `readEnvironmentVariables()`, `OptimizelyGraphConfig` |
| `@remkoj/optimizely-graph-client/router` | Content routing utilities, `VariationInput` |
| `@remkoj/optimizely-graph-client/channels` | Channel/site management |
| `@remkoj/optimizely-graph-client/admin` | Admin API client (generated) |
| `@remkoj/optimizely-graph-client/codegen` | GraphQL codegen integration helpers |
| `@remkoj/optimizely-graph-client/utils` | Shared utilities |

## Creating a client

```typescript
import createClient, { AuthMode } from '@remkoj/optimizely-graph-client'
// or
import { createClient, AuthMode } from '@remkoj/optimizely-graph-client'

// From environment variables — all flags default to false
const client = createClient()

// With explicit config
const client = createClient({ single_key: '...', gateway: 'https://cg.optimizely.com' })

// With a specific auth token / mode
const client = createClient(config, token)

// With Next.js caching flags (recommended for Next.js apps)
const client = createClient(undefined, undefined, {
  nextJsFetchDirectives: true, // attach Next.js cache/revalidate tags to each request
  cache: true,                 // cache responses at the CDN edge
  queryCache: true,            // cache the query execution plan on the server
})

// For preview/draft mode — disable all caching and switch to HMAC
const client = createClient(undefined, undefined, { nextJsFetchDirectives: true, cache: false, queryCache: false })
client.updateAuthentication(AuthMode.HMAC)
client.enablePreview()
```

## `AuthMode` enum

```typescript
import { AuthMode } from '@remkoj/optimizely-graph-client'

AuthMode.Public  // 'epi-single'  — read-only, single key (default)
AuthMode.HMAC    // 'use-hmac'    — HMAC signed; requires app_key + secret
AuthMode.Basic   // 'use-basic'   — Basic auth; requires app_key + secret
AuthMode.Token   // 'use-token'   — Bearer token
AuthMode.User    // 'use-user'    — Frontend user session
```

Switch auth mode at runtime with `client.updateAuthentication(AuthMode.HMAC)`.

## Draft / preview mode

```typescript
import { draftMode } from 'next/headers'

if (draftMode().isEnabled) {
  client.updateAuthentication(AuthMode.HMAC)
  client.enablePreview()   // requests include unpublished content
}
```

To stop previewing: `client.disablePreview()`.

## Executing queries

```typescript
import createClient from '@remkoj/optimizely-graph-client'

const client = createClient()
const result = await client.request(MyQueryDocument, { variables })
```

## Request id and errors

```typescript
import { OptiGraphRequestError } from '@remkoj/optimizely-graph-client/client'

// The request id Optimizely Graph returned for one of the 8 most recent requests of this client
const requestId = client.getRequestId()            // latest request
const forOperation = client.getRequestId('MyQuery') // latest request of that operation
```

- The id is read from the response headers (`correlation-id`, `x-request-id` or `x-correlation-id`); only the string is kept, never the response. When a client is shared between concurrent requests the id may belong to another request.
- Errors reported by the client include `[request-id: <id>]` in the console output. The `ClientError` thrown by `graphql-request` gets `requestId` and `status` properties; with `errorPolicy: 'all'` an `OptiGraphRequestError` (`requestId`, `status`, `operationName`) is thrown.
- `debug` and `query_log` output masks the `Authorization`, `cg-username` and `cg-roles` values.

## Utilities

```typescript
import { localeToGraphLocale } from '@remkoj/optimizely-graph-client'

// Convert a locale code (e.g. 'en-US') to the format expected by Optimizely Graph
const graphLocale = localeToGraphLocale(locale) // => 'en_US'
```

## Configuration type

```typescript
import type { OptimizelyGraphConfig } from '@remkoj/optimizely-graph-client/config'

type OptimizelyGraphConfig = {
  single_key: string
  app_key?: string
  secret?: string
  gateway?: string
  tenant_id?: string
  dxp_url?: string
  debug?: boolean
  query_log?: boolean
}
```

## `getSchemaInfo()` — for `codegen.ts`

```typescript
import getSchemaInfo from '@remkoj/optimizely-graph-client/codegen'

// Returns the schema URL + auth header object expected by @graphql-codegen/cli
const config: CodegenConfig = {
  schema: getSchemaInfo(),
  // ...
}
```

## Constraints

- `createClient()` reads `OPTIMIZELY_GRAPH_SINGLE_KEY` from env; ensure it is set before calling.
- Authenticated operations (mutations, admin API, preview) require `app_key` + `secret`.
- The default export is `createClient`.
- `nextJsFetchDirectives: true` must be set when you rely on Next.js `revalidatePath`/`revalidateTag` for cache invalidation.
