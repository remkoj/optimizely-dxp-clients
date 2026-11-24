# @remkoj/optimizely-cms-react

- **Path:** `packages/optimizely-cms-react`
- **Module:** ESM
- **Build tool:** `tsc`
- **Node:** none

## Scripts

| Script | Command |
| --- | --- |
| `prepare` | `tsc --build` |
| `watch` | `tsc --watch` |
| `clean` | `tsc --build --clean` |
| `recompile` | `tsc --build --clean && tsc --build --force` |

## Request id in errors

`components/cms-content/get-content.ts` appends `[request-id: …]` (from `client.getRequestId()`, guarded as mocked clients lack it) to the error thrown when the content cannot be loaded. Tested in `test/get-content-request-id.test.ts`.

## Subpath exports

| Export | Purpose |
| --- | --- |
| `.` | components and core types |
| `./rsc` | React Server Component utilities |
| `./utils` | shared utilities |
