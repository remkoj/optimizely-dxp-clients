# @remkoj/optimizely-cms-nextjs — usage

Next.js integration for Optimizely SaaS CMS.

## Install

```bash
npm install @remkoj/optimizely-cms-nextjs
```

Requires Node `>=24.0.0 <25.0.0`.

## Subpath exports

| Import path | Contents |
| --- | --- |
| `@remkoj/optimizely-cms-nextjs` | `OptimizelyNextPage`, `OnPageEdit`, `CmsPage` namespaces |
| `@remkoj/optimizely-cms-nextjs/rsc` | RSC-specific utilities |
| `@remkoj/optimizely-cms-nextjs/publish` | Content publish webhook helpers |
| `@remkoj/optimizely-cms-nextjs/types` | Shared TypeScript types |
| `@remkoj/optimizely-cms-nextjs/components` | CMS-aware Next.js components |
| `@remkoj/optimizely-cms-nextjs/preview` | On-Page Editing / preview mode integration |
| `@remkoj/optimizely-cms-nextjs/page` | Page-level CMS route helpers |

## Creating a Graph client (server-side)

```typescript
import { createClient, createAuthorizedClient } from '@remkoj/optimizely-cms-nextjs'

// Published content (uses Next.js fetch caching)
const client = createClient()

// Preview / draft content (disables cache)
const client = createAuthorizedClient(token)
```

Both functions are server-only (`import 'server-only'` is applied internally).

## Page components

```typescript
import type { OptimizelyNextPage } from '@remkoj/optimizely-cms-nextjs'

// Extends CmsComponent with optional metadata generation
const MyPage: OptimizelyNextPage<MyDataFragment> = ({ data, contentLink }) => { ... }

MyPage.getMetaData = async (contentLink, locale, client) => {
  return { title: '...' }
}
```

## On-Page Editing

```typescript
import { OnPageEdit } from '@remkoj/optimizely-cms-nextjs'
// or
import * as OnPageEdit from '@remkoj/optimizely-cms-nextjs/preview'
```

## CMS page routing

```typescript
import { CmsPage } from '@remkoj/optimizely-cms-nextjs'
// or specific helpers from '@remkoj/optimizely-cms-nextjs/page'
```

## Constraints

- Server-only: `createClient` and `createAuthorizedClient` must only be called in Server Components or Route Handlers.
- `createAuthorizedClient(token)` disables Next.js fetch caching — use only in preview/draft contexts.
