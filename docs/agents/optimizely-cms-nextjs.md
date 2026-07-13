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
