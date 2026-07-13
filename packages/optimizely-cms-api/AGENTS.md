# @remkoj/optimizely-cms-api — usage

CMS Integration REST API client for Optimizely SaaS CMS. CommonJS module.

## Install

```bash
npm install @remkoj/optimizely-cms-api
```

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `OPTIMIZELY_CMS_URL` | yes | CMS instance URL, e.g. `https://<tenant>.cms.optimizely.com` |
| `OPTIMIZELY_CMS_CLIENT_ID` | yes | OAuth client ID |
| `OPTIMIZELY_CMS_CLIENT_SECRET` | yes | OAuth client secret |
| `OPTIMIZELY_CMS_API_BASEURL` | no | Override the API base URL |
| `OPTIMIZELY_CMS_USER_ID` | no | Impersonate a specific user (`actAs`) |
| `OPTIMIZELY_DEBUG` | no | Set to `"1"` to enable request/response logging |

## Creating a client

```typescript
import { createClient, readEnvConfig } from '@remkoj/optimizely-cms-api'

// From environment variables (recommended)
const client = createClient()

// With explicit config
const client = createClient({
  base: new URL('https://<tenant>.cms.optimizely.com'),
  clientId: '...',
  clientSecret: '...',
  debug: false
})
```

## Key exports

| Export | Description |
| --- | --- |
| `createClient(config?)` | Creates a new API client instance. Reads env vars when config is omitted. |
| `readEnvConfig()` | Reads and validates env vars into `CmsIntegrationApiOptions`. |
| `readPartialEnvConfig()` | Reads env vars without requiring client credentials. |
| `isClientInstance(value)` | Type guard for `CmsIntegrationApiClient`. |
| `IntegrationApi.*` | All generated CMS API types (re-exported from `types.gen.ts`). |
| `ContentRoots` | Enum of well-known content root node GUIDs (SystemRoot, Trash, etc.). |
| `ApiClient` | Base client class. |
| `ApiError` | Error thrown when an API operation fails. |
| `ApiClientInstance` | Type alias for a client instance. |

## Types

```typescript
import type { CmsIntegrationApiOptions, ApiClientInstance } from '@remkoj/optimizely-cms-api'
import { IntegrationApi } from '@remkoj/optimizely-cms-api'

// Use IntegrationApi.ContentType, IntegrationApi.DisplayTemplate, etc.
```

## Constraints

- CommonJS module — works with both `require()` and `import`.
- `ApiError` exposes `.status`, `.statusText`, `.data`, `.request`, `.response`.
- `ContentRoots` values are GUIDs as strings.
