# @remkoj/optimizely-cms-nextjs — usage

> [!WARNING]
> This package is obsolete. Use Optimizely's official [`@optimizely/cms-sdk`](https://www.npmjs.com/package/@optimizely/cms-sdk) and [`@optimizely/cms-cli`](https://www.npmjs.com/package/@optimizely/cms-cli) packages instead.

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
| `@remkoj/optimizely-cms-nextjs/rsc` | Server-side client factory `createNextJsClient` and its deprecated aliases |
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
import { createPage } from '@remkoj/optimizely-cms-nextjs/page'
import { createNextJsClient } from '@remkoj/optimizely-cms-nextjs/rsc'
import { getContentByPath } from '@gql/functions'
import { factory } from '@/components/factory'

const { generateMetadata, generateStaticParams, CmsPage: Page } = createPage(factory, {
  // Inject the generated master query to load all page content in one request
  getContentByPath,

  // Use a scope-aware client factory; see "Draft Mode" below.
  client: (token, scope) => createNextJsClient(token, scope ?? 'request'),

  // Optional: map params to a single locale (omit for multi-lingual with [lang] segment)
  // paramsToLocale: () => 'en',
})

// Choose the route settings appropriate for your site.
export const dynamicParams = true   // allow new pages without rebuild
export const revalidate = false     // keep cache until webhook revalidates
export { generateMetadata, generateStaticParams }
export default Page
```

The client factory receives `(token, scope)`, where `scope` is `'request'` when rendering a page or generating its metadata and `'metadata'` when generating static params; it may be async.

### Draft Mode

`createNextJsClient` reads Next.js Draft Mode in `request` scope unless `disableDraftMode` is true. When enabled, it switches a public client to HMAC and enables preview; an already authorized client is left unchanged. `metadata` scope skips request access. Reading Draft Mode does not make a route dynamic in Next.js 16, but it must not be called in `generateStaticParams`; `createPage` only uses the `request` scope while rendering.

`createPage`, `createLayout` and `createPublishApi` default to `createNextJsClient`, so the scope-aware factory above is only needed to customise the client. `createPage` and `createLayout` call it with a scope (`createLayout` always `'metadata'`, so layout metadata is never draft-aware); `createPublishApi` calls it with `(undefined, 'metadata')` (never draft-aware) and awaits the result, or uses a Graph client instance as-is; anything that is neither an `IOptiGraphClient` nor a factory returning one makes the handler throw. The deprecated aliases (`createClient`, `createAuthorizedClient`, `getServerClient`, `getAuthorizedServerClient`) accept only a token and return a promise.

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
- Use `createNextJsClient` with the appropriate scope for CMS pages. Client factories for `createPage`, `createLayout` and `createPublishApi` may be synchronous or asynchronous.
- Do not read Draft Mode in `generateStaticParams`: use the `metadata` scope there (`createPage` already does).
- `createPublishApi` is the default export of `./publish`.
- When a page cannot be resolved, the error output includes `[request-id: …]` (the Optimizely Graph request id from `client.getRequestId()`) and, for empty results, the request variables (capped at 2000 characters); quote the id when contacting Optimizely Support.
