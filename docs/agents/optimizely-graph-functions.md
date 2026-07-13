# @remkoj/optimizely-graph-functions

- **Path:** `packages/optimizely-graph-functions`
- **Module:** CommonJS
- **Build tool:** `tsc`
- **Node:** none
- **Constraint:** requires patched `@graphql-codegen/visitor-plugin-common` from `dependencies/`

## Scripts

| Script | Command |
| --- | --- |
| `prepare` | `tsc --build` |
| `watch` | `tsc --watch` |
| `clean` | `tsc --build --clean` |
| `recompile` | `tsc --build --clean && tsc --build --force` |
| `opti-patch` | `node dist/patch.js` |

## Subpath exports

| Export | Contents |
| --- | --- |
| `.` | main entry |
| `./plugin` | `graphql-codegen` plugin |
| `./preset` | codegen preset |
| `./transform` | document transform |
| `./documents` | shared GraphQL fragment documents |
| `./loader` | document loader |
| `./contenttype-loader` | content-type loader |
| `./generate` | code generation utilities |

After `yarn install` or `yarn upgrade`, re-apply patched dep: `yarn opti-graph patches:apply`
