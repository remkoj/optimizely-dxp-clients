# @remkoj/optimizely-one-nextjs

- **Path:** `packages/optimizely-one-nextjs`
- **Module:** ESM
- **Build tool:** `tsc` + Tailwind CSS
- **Node:** `>=24.0.0 <25.0.0`

## Scripts

| Script | Command |
| --- | --- |
| `prepare` | `tsc --build --force && tailwindcss -i src/styles.css -o dist/styles.css --minify` |
| `watch` | `tsc --watch` (TypeScript only) |
| `watch-styles` | `tailwindcss -i src/styles.css -o dist/styles.css --minify --watch` |
| `tailwind` | `tailwindcss -i src/styles.css -o dist/styles.css --minify` |
| `clean` | `tsc --build --clean` |
| `recompile` | `tsc --build --clean && tsc --build --force` (does not recompile CSS) |

`recompile` does not rebuild `dist/styles.css` — run `tailwind` afterwards.

## Subpath exports

| Export | Contents |
| --- | --- |
| `.` | core integration |
| `./api` | API route helpers |
| `./client` | client-side components |
| `./server` | server-side utilities |
