# Optimizely SaaS CMS - Next.js Integration

> [!WARNING]
> There'll be an update of Optimizely SaaS CMS that is incompatible with all SDK versions prior to 5.1.6. If you don't upgrade, you will see empty pages (main website) and "Component not found" messages (preview).

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
import getFactory from '@/components/factory' // Or any other file where you have your component factory defined.
import { getContentByPath } from "@/gql/functions" // Or any other file that has the `getContentByPath` function

const { CmsPage, generateMetadata, generateStaticParams } = OptimizelyCmsPage.createPage(getFactory(), {
    getContentByPath: getContentByPath
})

// Configure the Next.JS route handling for the pages
export const dynamic = "error"; // Make sure we're leveraging SSG for CMS managed pages.
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

### Cache invalidation
Default implementation to handle webhooks from Optimizely Graph to purge the Next.js cache based upon taht incoming request.

```typescript
// In `src/app/api/content/publish/route.ts`

import createPublishApi from '@remkoj/optimizely-cms-nextjs/publish'

const publishApi = createPublishApi(
    { 
        paths: [ '/', '/[[...path]]', '/sitemap.xml' ] // The list of fall-back paths to flush,
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
The package provides the following enhancements for Next.js middleware:
| Wrapper | import | Purpose |
| --- | --- | --- |
| withEditFallback | `@remkoj/optimizely-cms-nextjs/preview` | Rewrite incoming Optimizely CMS 12 preview / on-page-edit URLs to Optimizely SaaS CMS preview  URLs |
| withLanguagePrefix | `@remkoj/optimizely-cms-nextjs/page` | Handle the redirect of the homepage `/` to the locale that best matches the incoming request, such as `/en`. The locales and their URLs are taken from the second parameter - the ChannelDefinition.

If you use both wrappers, the `withEditFallback` wrapper must wrap the `withLanguagePrefix` wrapper, to ensure that the edit mode URL is rewritten before the language prefix is applied.
