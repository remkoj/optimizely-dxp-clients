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

Mount the Optimizely One API handler in `app/api/me/route.ts`:

```typescript
import { createHandler } from '@remkoj/optimizely-one-nextjs/api'
export const { GET, POST } = createHandler()
```

## Client components

```typescript
import { OptimizelyOneGadget } from '@remkoj/optimizely-one-nextjs/client'
// Renders the Optimizely One debug panel (dev/preview only)
```

## Server utilities

```typescript
import { getEnabledProducts } from '@remkoj/optimizely-one-nextjs/server'
// Returns which Optimizely One products are enabled based on config
```

## Constraints

- `dist/styles.css` must be imported at the application root; it is not injected automatically.
- Server utilities are server-only; do not import from client components.
