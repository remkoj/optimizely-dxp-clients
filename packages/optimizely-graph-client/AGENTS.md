# @remkoj/optimizely-graph-client — usage

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
