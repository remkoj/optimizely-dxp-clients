# @remkoj/optimizely-one-nextjs — usage

Optimizely One integration for Next.js — connects Optimizely Data Platform (ODP),
Content Recommendations, and Web Experimentation to a Next.js application.

## Install

```bash
npm install @remkoj/optimizely-one-nextjs
```

Requires Node `>=24.0.0 <25.0.0`. Import the stylesheet in your root layout.

```typescript
import '@remkoj/optimizely-one-nextjs/dist/styles.css'
```

## Environment variables

| Variable | Description |
| --- | --- |
| `OPTIMIZELY_ONE_HELPER` | Enable/disable the Optimizely One helper (default: `false`) |
| `ODP_API_KEY` | Optimizely Data Platform API key |
| `ODP_SERVICE` | ODP service endpoint (default: `https://api.zaius.com/`) |
| `CONTENT_RECS_CLIENT` | Content Recommendations client ID |
| `CONTENT_RECS_DELIVERY_KEY` | Content Recommendations API key |
| `WEB_EXPERIMENTATION_PROJECT` | Web Experimentation project ID |
| `OPTIMIZELY_DEBUG` | Set to `"1"` for debug logging |

## Subpath exports

| Import path | Contents |
| --- | --- |
| `@remkoj/optimizely-one-nextjs` | Core types and configuration |
| `@remkoj/optimizely-one-nextjs/api` | Next.js API route handlers for Optimizely One |
| `@remkoj/optimizely-one-nextjs/client` | Client-side components and hooks |
| `@remkoj/optimizely-one-nextjs/server` | Server-side utilities |

## Configuration

```typescript
import { readConfigFromEnv } from '@remkoj/optimizely-one-nextjs'

// Reads all Optimizely One config from environment variables
const config = readConfigFromEnv()
```

## API routes

Mount the Optimizely One API handler in `app/api/me/[[...path]]/route.ts`.
The catch-all segment name must match `pathParameterName` (default: `'path'`).

```typescript
import { createOptimizelyOneApi } from '@remkoj/optimizely-one-nextjs/api'

const handler = createOptimizelyOneApi()

export const GET = handler
export const POST = handler
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
```

## Server-side product clients (import from `./api` or `./server`)

`DataPlatform` and `ContentRecs` are available as named exports from both `./api` and `./server`.

```typescript
import { DataPlatform, ContentRecs } from '@remkoj/optimizely-one-nextjs/api'
// or from '@remkoj/optimizely-one-nextjs/server'

// Optimizely Data Platform
if (DataPlatform.Tools.isEnabled()) {
  const vuid = DataPlatform.Tools.getVisitorID(cookies())
  const client = new DataPlatform.Client()
  const terms = await client.getLastSearchTerms(vuid)
}

// Content Recommendations
if (ContentRecs.Tools.isEnabled()) {
  const visitorId = ContentRecs.Tools.getVisitorID(cookies())
  const client = new ContentRecs.Client()
  const topics = await client.getContentTopics(visitorId)
}
```

## Client components (import from `./client`)

```typescript
import {
  OptimizelyOneProvider,  // context provider — wrap around your root layout body
  OptimizelyOneGadget,    // debug panel; render only in dev/preview
  PageActivator,          // fires page-view events on route change
  ContentRecsDelivery,    // renders personalised content recommendations
} from '@remkoj/optimizely-one-nextjs/client'

// In root layout:
<OptimizelyOneProvider>
  <PageActivator />
  {children}
  <OptimizelyOneGadget />
</OptimizelyOneProvider>

// In a component:
<ContentRecsDelivery
  apiKey={deliveryApiKey}
  count={3}
  template={ArticleTemplate}
  className="grid grid-cols-3"
/>
```

## Server utilities (import from `./server`)

```typescript
import { Scripts, OptimizelyOneGadget, EnvTools } from '@remkoj/optimizely-one-nextjs/server'

// Inject required tracking scripts
<Scripts nonce={nonce} />

// Read environment-controlled feature flags
const enabled = EnvTools.readValueAsBoolean('OPTIMIZELY_ONE_HELPER', false)
const key = EnvTools.readValue('GA_TRACKING_ID')
```

## Constraints

- `dist/styles.css` is imported by the components in the package, if the framework does not support that, it must be imported manually.
- Server utilities (`./server`) are server-only; do not import from client components.
- The API route must be a catch-all (`[[...path]]`) so every sub-path is handled by the same handler.
