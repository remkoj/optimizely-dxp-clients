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
| `OPTIMIZELY_CMS_API_BASEURL` | no | Override the auto-detected API base URL. Rarely needed — see below |
| `OPTIMIZELY_CMS_USER_ID` | no | Impersonate a specific user (`actAs`) |
| `OPTIMIZELY_DEBUG` | no | Set to `"1"` to enable request/response logging |

## API URL resolution

The API base URL is resolved in this order, whether the configuration comes from environment
variables (`readPartialEnvConfig()`), from CLI arguments, or from an object passed to
`createClient()`:

1. `OPTIMIZELY_CMS_API_BASEURL` (or `apiBaseUrl`) is set → used verbatim, including any path prefix.
2. The CMS URL is a SaaS CMS host (`<tenant>.cms<env>.optimizely.com`) → the matching managed
   gateway, `https://api.cms<env>.optimizely.com/v1`. The environment suffix carries over, the
   tenant does not.
3. The CMS URL is any other host (self-hosted) → `<cms url>/_cms/v1`.
4. Neither is set → `https://api.cms.optimizely.com/v1`.

So a tester on `OPTIMIZELY_CMS_URL=https://app-xyz.cmstest.optimizely.com` reaches
`https://api.cmstest.optimizely.com/v1` without further configuration. Only set
`OPTIMIZELY_CMS_API_BASEURL` when the gateway cannot be derived from the CMS URL.

The OAuth token endpoint follows the same split: managed gateways serve it from the host root
(`https://api.cms<env>.optimizely.com/oauth/token`), self-hosted instances from
`<cms url>/_cms/v1/oauth/token`.

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
