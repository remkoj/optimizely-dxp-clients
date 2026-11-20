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

## Tests

Registered in `testedPackages` in the root `vitest.config.mjs`. Tests live in `test/` (outside `src`, so not part of the build) and run with `yarn test` from the repo root, or `yarn vitest run --project hey-api-wrapper`. They must keep stdout/stderr clean: spy on the console and assert any expected output.

## Constraints

- `ApiError` stores and exposes the full request and response; do not strip them. Sanitizing is the implementor's responsibility (documented in the JSDoc, `README.md` and `AGENTS.md`); keep these notes accurate.
- Debug logging must mask query-string values (`redactUrl`), and the `ApiError` message must be sanitized (`sanitizeMessage`).

