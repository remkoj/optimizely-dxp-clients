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
| `@remkoj/optimizely-cms-nextjs/publish` | Content publish webhook helpers (`createPublishApi`) |
| `@remkoj/optimizely-cms-nextjs/types` | Shared TypeScript types |
| `@remkoj/optimizely-cms-nextjs/components` | CMS-aware Next.js components |
| `@remkoj/optimizely-cms-nextjs/preview` | On-Page Editing / preview mode (`createEditPageComponent`) |
| `@remkoj/optimizely-cms-nextjs/page` | Page-level CMS route helpers (`createPage`, `createLayout`) |

## Page components

```typescript
import type { OptimizelyNextPage } from '@remkoj/optimizely-cms-nextjs'
import { MyPageDataFragmentDoc, type MyPageDataFragment } from '@/gql/graphql'

// Extends CmsComponent with optional metadata generation
const MyPage: OptimizelyNextPage<MyPageDataFragment> = ({ data, contentLink, ctx }) => { ... }

// Static fragment declaration — required for data loading
MyPage.getDataFragment = () => ['MyPageData', MyPageDataFragmentDoc]

// Optional: generate Next.js metadata
MyPage.getMetaData = async (contentLink, locale, client) => {
  return { title: '...' }
}
```

## `app/[[...path]]/page.tsx` — CMS page route

Use `createPage()` to generate the three Next.js exports (`generateStaticParams`, `generateMetadata`, `CmsPage`) for the catch-all route.

```typescript
import 'server-only'
import { createClient, AuthMode } from '@remkoj/optimizely-graph-client'
import { createPage } from '@remkoj/optimizely-cms-nextjs/page'
import { getContentByPath } from '@gql/functions'
import { factory } from '@/components/factory'
import { draftMode } from 'next/headers'

const { generateMetadata, generateStaticParams, CmsPage: Page } = createPage(factory, {
  // Inject the generated master query to load all page content in one request
  getContentByPath,

  // Required: factory function that creates the GraphQL client
  client: (_, scope) => {
    const client = createClient(undefined, undefined, {
      nextJsFetchDirectives: true,
      cache: true,
      queryCache: true,
    })
    if (scope === 'request' && draftMode().isEnabled) {
      client.updateAuthentication(AuthMode.HMAC)
      client.enablePreview()
    }
    return client
  },

  // Optional: map params to a single locale (omit for multi-lingual with [lang] segment)
  // paramsToLocale: () => 'en',
})

export const dynamic = 'error'      // fail loudly if the route becomes dynamic
export const dynamicParams = true   // allow new pages without rebuild
export const revalidate = false     // keep cache until webhook revalidates
export { generateMetadata, generateStaticParams }
export default Page
```

The `client` option is **required**. The `scope` argument is `'request'` when rendering a page and `'metadata'` when generating metadata.

## `app/preview/page.tsx` — On-Page Editing route

```typescript
import 'server-only'
import { createEditPageComponent } from '@remkoj/optimizely-cms-nextjs/preview'
import { getContentById } from '@gql/functions'
import { factory } from '@/components/factory'
import { createClient } from '@remkoj/optimizely-graph-client'

export default createEditPageComponent(factory, {
  loader: getContentById,
  clientFactory: (token?: string) => createClient(undefined, token, {
    nextJsFetchDirectives: true,
    cache: false,
    queryCache: false,
  }),
  refreshTimeout: 500, // ms between polling for content updates
})

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0
export const runtime = 'nodejs'
```

## `app/api/content/publish/route.ts` — Publish webhook

```typescript
import createPublishApi from '@remkoj/optimizely-cms-nextjs/publish'
import { createClient } from '@remkoj/optimizely-graph-client'

const handler = createPublishApi({
  additionalPaths: ['/api/content/search', '/sitemap.xml'],
  optimizePublish: true,  // resolve and revalidate only the changed path
  client: () => createClient(undefined, undefined, { nextJsFetchDirectives: true, cache: false, queryCache: false }),
})

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const GET = handler
export const POST = handler
```

## Constraints

- All files using these helpers must include `import 'server-only'`.
- Use `createClient` from `@remkoj/optimizely-graph-client` directly; do not import it from this package.
- Set `dynamic = 'error'` on the `[[...path]]` route to detect unintended dynamic rendering early.
- `createPublishApi` is the default export of `./publish`.
