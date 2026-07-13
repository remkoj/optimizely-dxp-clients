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
