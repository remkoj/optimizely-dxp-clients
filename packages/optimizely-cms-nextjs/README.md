# Optimizely SaaS CMS - Next.js Integration

> [!WARNING]
> This package is obsolete. Use Optimizely's official [`@optimizely/cms-sdk`](https://www.npmjs.com/package/@optimizely/cms-sdk) and [`@optimizely/cms-cli`](https://www.npmjs.com/package/@optimizely/cms-cli) packages instead.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)

> [!TIP]
> Looking to implement a new Next.js based site with Optimizely SaaS CMS? The easiest way to get started is our [project template]([http](https://github.com/remkoj/optimizely-saas-starter)).

This package provides the needed components to implement a Next.js based frontedn for Optimizely SaaS CMS, with full support for the preview capabilities of Optimizely CMS.

[Release notes](https://github.com/remkoj/optimizely-dxp-clients/releases)

## Features
### Catch-all route rendering
Default implementation of the Catch-All route in Next.js to allow rendering any page created and managed by editors.

```typescript
// In `src/app/[[...path]]/page.tsx`

import { CmsPage as OptimizelyCmsPage } from "@remkoj/optimizely-cms-nextjs"
import { createNextJsClient } from "@remkoj/optimizely-cms-nextjs/rsc"
import getFactory from '@/components/factory' // Or any other file where you have your component factory defined.
import { getContentByPath } from "@/gql/functions" // Or any other file that has the `getContentByPath` function

const { CmsPage, generateMetadata, generateStaticParams } = OptimizelyCmsPage.createPage(getFactory(), {
    getContentByPath: getContentByPath,
    client: (token, scope) => createNextJsClient(token, scope ?? "request")
})

// Configure the Next.JS route handling for the pages
// Choose the route settings appropriate for your site.
export const dynamicParams = true; // Allow new pages to be resolved without rebuilding the site.
export const revalidate = false; // Keep the cache untill manually revalidated using the Webhook.
export const fetchCache = "default-cache"; // Cache fetch results by default, while allowing an opt-out.

// Export CMS Page
export {
    generateMetadata,
    generateStaticParams
}
export default CmsPage
```

The `createPage` method has many more options allowing you to take control over what is happening while the page renders. The options object has built-in documentation that your IDE can show if you've got JavaScript / TypeScript language support enabled.

### Draft Mode
`createNextJsClient` is asynchronous and reads Next.js Draft Mode by default in
`request` scope. When Draft Mode is enabled, it switches a public client to
HMAC authentication and enables preview; an already authorized client is left
unchanged. Set `disableDraftMode: true` to skip this check, or use `metadata`
scope when creating a client outside a request.

`createPage`, `createLayout` and `createPublishApi` default to
`createNextJsClient`. `createPage` calls the client factory with the `request`
scope for rendering and metadata and with the `metadata` scope for
`generateStaticParams`; `createLayout` always uses the `metadata` scope, so the
layout metadata is never draft-aware. Provide a factory only to customise the
client:

```typescript
import { createNextJsClient } from "@remkoj/optimizely-cms-nextjs/rsc"

const { CmsPage, generateMetadata, generateStaticParams } = OptimizelyCmsPage.createPage(getFactory(), {
    getContentByPath: getContentByPath,
    client: (token, scope) => createNextJsClient(token, scope ?? "request")
})
```

Reading Draft Mode does not make a route dynamic in Next.js 16. Do not call it
in `generateStaticParams`; the `request` scope is only used while rendering.

> **Protect the route that enables Draft Mode.** Draft Mode is enabled by a
> cookie that any caller of your enable route receives, and with
> `createNextJsClient` that cookie elevates Optimizely Graph access to HMAC
> with preview, exposing unpublished content. In production, this route MUST
> check a secret/token before enabling Draft Mode: compare it in constant time
> and never log it. The `.well-known/drafts` route in `samples/basic-project`
> shows where to put this check, but it is not production grade: it compares
> the publish token from the query string, which leaks the token into URLs and
> logs.

`createClient`, `createAuthorizedClient`, `getServerClient` and
`getAuthorizedServerClient` are deprecated token-only aliases of
`createNextJsClient` and return a promise. Client factories for `createPage`,
`createLayout` and `createPublishApi` may be synchronous or asynchronous.

### Cache invalidation
Default implementation to handle webhooks from Optimizely Graph to purge the Next.js cache based upon taht incoming request.

```typescript
// In `src/app/api/content/publish/route.ts`

import createPublishApi from '@remkoj/optimizely-cms-nextjs/publish'
import { createClient } from '@remkoj/optimizely-graph-client'

const publishApi = createPublishApi(
    { 
        paths: [ '/', '/[[...path]]', '/sitemap.xml' ], // The list of fall-back paths to flush
        client: () => createClient(),
        optimizePublish: true // Use the data received from Graph to selectively flush the cache
    }
)

// Configure the Next.JS route handling for the pages
export const dynamic = 'force-dynamic'      // Make sure all API-Requests are executed
export const dynamicParams = true           // Make sure all matching routes are always executed
export const revalidate = 0                 // Don't cache
export const fetchCache = 'force-no-store'  // Don't cache
export const runtime = 'edge'               // Run at the edge

// Export API Handler
export const GET = publishApi
export const POST = publishApi
```

The `createPublishApi` method has many more options allowing you to take control over what is happening while the page renders. The options object has built-in documentation that your IDE can show if you've got JavaScript / TypeScript language support enabled.


### Middleware
The package provides the following enhancement for Next.js middleware:
| Wrapper | import | Purpose |
| --- | --- | --- |
| withLanguagePrefix | `@remkoj/optimizely-cms-nextjs/page` | Handle the redirect of the homepage `/` to the locale that best matches the incoming request, such as `/en`. The locales and their URLs are taken from the second parameter - the ChannelDefinition.

> **Breaking change:** The `withEditFallback` wrapper (previously exported from `@remkoj/optimizely-cms-nextjs/preview`) has been removed. It only served Optimizely CMS 12 preview / on-page-edit URLs, which are no longer supported, and it injected the `OPTIMIZELY_PUBLISH_TOKEN` as preview token for unauthenticated requests. Remove it from your middleware.
