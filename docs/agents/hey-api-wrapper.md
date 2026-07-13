# @remkoj/hey-api-wrapper

- **Path:** `packages/hey-api-wrapper`
- **Module:** CommonJS (no `type` field)
- **Build tool:** `tsc`
- **Node:** none
- **Scope:** internal — consumed by `@remkoj/optimizely-cms-api`, not for direct use

## Scripts

| Script | Command |
| --- | --- |
| `prepare` | `tsc --build` |
| `watch` | `tsc --watch` |
| `clean` | `rimraf ./dist ./*.tsbuildinfo` |
| `recompile` | `clean` + `tsc --build --force` |
