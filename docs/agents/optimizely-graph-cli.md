# @remkoj/optimizely-graph-cli

- **Path:** `packages/optimizely-graph-cli`
- **Module:** ESM
- **Build tool:** Rollup
- **Node:** `>=24.0.0 <25.0.0`
- **Bin:** `opti-graph` → `bin/index.js`

## Scripts

| Script | Command |
| --- | --- |
| `prepare` | `node script/update-cfg.js && rollup --config rollup.config.js` |
| `recompile` | `node script/update-cfg.js && yarn rollup --config rollup.config.js` |
| `watch` | `rollup --config rollup.config.js --watch` |
| `update-cfg` | `node script/update-cfg.js` |
| `opti-graph` | `node bin/index.js` |

Rollup always does a full build; `recompile` is identical to `prepare`.

After `yarn install` or `yarn upgrade`, re-apply the patched dep: `yarn opti-graph patches:apply`

## Webhook commands

- `webhook:create`, `webhook:delete` and `webhook:list` use the Admin API through `@remkoj/optimizely-graph-client/admin`; the helpers for matching and building webhooks are in `src/utils/webhooks.ts` (`isSameTarget`, `isCurrentRegistration`, `buildWebhookPayload`, `displayUrl`).
- `webhook:delete` matches on host and path only; its `--publish_token` option (default `FRONTEND_PUBLISH_TOKEN`) is optional, deprecated and ignored, but kept so existing invocations and `test/publish-token.test.ts` (masking) keep working.
- The publish token is sent as webhook header (`readEnvironmentVariables().publish_header`, default `X-OPTLY-PUBLISH`), never in the URL. A webhook counts as "already registered" only when URL (without query), method, header name and header value match; otherwise every webhook for the same origin + path is replaced. Whether Optimizely Graph echoes header values in the list response is **unverified**; if it masks them the command re-registers on each run, which is harmless.
- Output never contains the token or a legacy `?token=` value (`displayUrl`).
- `test/admin-commands.test.ts` characterizes every command that uses the Admin API (webhook:list/create/delete, source:list/clear/delete) with a stubbed `fetch`. The CLI resolves the built graph-client (`dist`), so run `yarn prepare` first.
