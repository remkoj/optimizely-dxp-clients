# @remkoj/optimizely-cms-cli

- **Path:** `packages/optimizely-cms-cli`
- **Module:** ESM
- **Build tool:** Rollup
- **Node:** `>=24.0.0 <25.0.0`
- **Bin:** `opti-cms` → `dist/index.js`

## Scripts

| Script | Command |
| --- | --- |
| `prepare` | `node script/update-cfg.js && rollup -c` |
| `recompile` | `node script/update-cfg.js && rollup -c` |
| `watch` | `rollup -c rollup.config.js --watch` |
| `compile` | `rollup -c rollup.config.js` |
| `update-cfg` | `node script/update-cfg.js` |
| `opti-cms` | `node dist/index.js` |

Rollup always does a full build; `recompile` is identical to `prepare`.
