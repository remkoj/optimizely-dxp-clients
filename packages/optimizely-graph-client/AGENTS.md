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
import createClient from '@remkoj/optimizely-graph-client'
// or
import { createClient } from '@remkoj/optimizely-graph-client'

// From environment variables (recommended)
const client = createClient()

// With explicit config
const client = createClient({
  single_key: '...',
  gateway: 'https://cg.optimizely.com'
})

// With HMAC authentication (for mutations)
const client = createClient(config, token)
```

## Executing queries

```typescript
import createClient from '@remkoj/optimizely-graph-client'

const client = createClient()
const result = await client.request(MyQueryDocument, { variables })
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

## Constraints

- `createClient()` reads `OPTIMIZELY_GRAPH_SINGLE_KEY` from env; ensure it is set before calling.
- Authenticated operations (mutations, admin API) require `app_key` + `secret`.
- The default export is `createClient`.
