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
