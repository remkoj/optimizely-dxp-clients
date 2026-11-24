# @remkoj/optimizely-cms-nextjs

- **Path:** `packages/optimizely-cms-nextjs`
- **Module:** ESM
- **Build tool:** `tsc`
- **Node:** `>=24.0.0 <25.0.0`

## Scripts

| Script | Command |
| --- | --- |
| `prepare` | `tsc --build` |
| `watch` | `tsc --watch` |
| `clean` | `tsc --build --clean` |
| `recompile` | `tsc --build --clean && tsc --build --force` |

## Request id logging

When a page cannot be resolved, `cms-page/_loadContentByPath.ts` and `cms-page/page.tsx` add `[request-id: …]` (from `client.getRequestId()`, guarded as older/mocked clients lack it) and, for empty results, the request variables (capped at 2000 characters) to the existing `console.error` output through `getRequestDiagnostics` in `cms-page/_base.ts`. This only runs on error paths. Tested in `test/request-id-logging.test.tsx`.

## Subpath exports

| Export | Contents |
| --- | --- |
| `.` | core integration |
| `./rsc` | React Server Component helpers |
| `./publish` | content publishing utilities |
| `./types` | shared TypeScript types |
| `./components` | CMS-aware Next.js components |
| `./preview` | On-Page Editing / preview mode |
| `./page` | page-level CMS route helpers |

## Client factories and Draft Mode

`src/client.ts` (exported from `.` and `./rsc`) provides the asynchronous `createNextJsClient(token?, configOrScope?)`. The deprecated `createClient`, `createAuthorizedClient`, `getServerClient` and `getAuthorizedServerClient` aliases accept only a token and use the default `request` scope.

- Unless `disableDraftMode` is true, `request` scope reads Next.js Draft Mode; when enabled, a public client switches to HMAC and preview. Already authorized clients are left unchanged. `metadata` scope skips request access. Authentication overrides using a matching publish token or HMAC/Basic mode are limited to development/debug and can be disabled with `disableTokenBypass`.
- `createPage` calls its client factory with `(undefined, 'request')` for rendering and metadata, and `(undefined, 'metadata')` for static params. Its default is `createNextJsClient`, so static parameter generation does not read Draft Mode. `createLayout` calls its factory with `(undefined, 'metadata')` and so is never draft-aware. `createPublishApi` resolves its client through `resolveClient(client, undefined, 'metadata')`, so the default client never reads Draft Mode; it accepts a Graph client instance, a synchronous or asynchronous factory, or a configuration. `resolveClient` (exported from `src/client.ts`) returns clients as-is, creates a client from a configuration (via `createNextJsClient`, ignoring its scope argument) and calls factories with `(token, configOrScope)`.
- Draft Mode is enabled by whoever calls the route that sets the Draft Mode cookie, and `createNextJsClient` then elevates Graph access to HMAC + preview (same as 5.x). Such a route MUST be protected in production (secret/token check, constant-time comparison, token never logged). `samples/basic-project/src/app/.well-known/drafts/route.ts` only holds a placeholder check against the publish token in the query string (which leaks it into URLs and logs); it is not production grade.
- `createNextJsClient` reports authentication overrides and the Draft Mode switch through `logger.warn` from `src/logger.ts`, which always writes to stderr (`console.warn`) and is never gated; stdout stays clean in production. Warnings may only be silenced in tests (spy in the test setup), never in production code.
- `createPublishApi` accepts an `IOptiGraphClient` instance or a (async) factory returning one; anything else makes the handler throw `The client must be an instance of IOptiGraphClient or a factory function returning the client`.
- `test/draft-mode-client.test.tsx` covers `createNextJsClient` (Draft Mode on/off, `metadata` scope, `disableDraftMode`, authorized tokens), the `createPage`/`createLayout` call paths and the publish API client handling.
