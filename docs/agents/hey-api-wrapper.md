# @remkoj/hey-api-wrapper

- **Path:** `packages/hey-api-wrapper`
- **Module:** CommonJS (`"type": "commonjs"`); `exports` map: `.` (types + `dist/index.js`), `./hmac` (`dist/hmac-fetch.js`) and `./package.json`, with a `typesVersions` entry for `hmac`. Deep imports of `dist/*` are not available; types that consumers' declaration emit must name have to be exported from the root `index.ts`
- **Build tool:** `tsc`
- **Node:** none
- **Dependencies:** `crypto-js` (MD5, HMAC-SHA256 and Base64 for the HMAC signature; runtime-agnostic, chosen over `node:crypto` for edge/browser use and because WebCrypto has no MD5)
- **Scope:** internal — consumed by `@remkoj/optimizely-cms-api` and `@remkoj/optimizely-graph-client`, not for direct use

## Scripts

| Script | Command |
| --- | --- |
| `prepare` | `tsc --build` |
| `watch` | `tsc --watch` |
| `clean` | `rimraf ./dist ./*.tsbuildinfo` |
| `recompile` | `clean` + `tsc --build --force` |

## Tests

Registered in `testedPackages` in the root `vitest.config.mjs`. Tests live in `test/` (outside `src`, so not part of the build) and run with `yarn test` from the repo root, or `yarn vitest run --project hey-api-wrapper`. They must keep stdout/stderr clean: spy on the console and assert any expected output.

## HMAC-signed fetch (`./hmac`)

`src/hmac-fetch.ts` exports `createHmacFetch(appKey, secret)` (and the `FetchAPI` type) as `@remkoj/hey-api-wrapper/hmac`; it is intentionally not exported from the root entry point. It signs every request with an `epi-hmac` Authorization header (App Key, method, path+query, timestamp, nonce and MD5 of the body, which is read in full for `Request` inputs because HeyAPI calls `fetch(new Request(...))`). Used by `@remkoj/optimizely-graph-client` for the Admin API client and the `AuthMode.HMAC` GraphQL client. The tests are in `test/hmac-fetch.test.ts` (signature recomputed independently) and `test/package-exports.test.ts` (needs a built `dist`, run `yarn prepare` first).

## Constraints

- `ApiError` stores and exposes the full request and response; do not strip them. Sanitizing is the implementor's responsibility (documented in the JSDoc, `README.md` and `AGENTS.md`); keep these notes accurate.
- Debug logging must mask query-string values (`redactUrl`), and the `ApiError` message must be sanitized (`sanitizeMessage`).
- The "CMS API" wording in the response log and the default `ApiError` message is the fallback for clients without a configured `name` (keeps `optimizely-cms-api` output identical); clients that set `name` (e.g. graph-client: `Graph Admin API`) get that name. Operation methods must throw through `ApiClient.createApiError`.

