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
| `postinstall` | `node script/postinstall.mjs` — runs `project:ai` in the consumer project after each install/upgrade |
| `opti-cms` | `node dist/index.js` |

Rollup always does a full build; `recompile` is identical to `prepare`.

## Source structure

| Path | Purpose |
| --- | --- |
| `src/app.ts` | Yargs app factory (`createOptiCmsApp`) — global options, help, version |
| `src/types.ts` | Shared types: `CliModule<P>`, `OptiCmsArgs<P>`, `CliModuleList` |
| `src/commands/index.ts` | Registers all commands in the `commands` array |
| `src/commands/<name>.ts` | One file per command |
| `src/tools/` | Shared helpers (CMS client, schema loading, `parseArgs`, etc.) |

## Adding a command

1. Create `src/commands/<name>.ts` and export a `CliModule<P>` constant named `<Name>Command`.
2. Import and append it to the `commands` array in `src/commands/index.ts`.
3. Add a row to the commands table in `packages/optimizely-cms-cli/AGENTS.md`.

Commands that do **not** need CMS credentials (e.g. `project:ai`, `project:migrate`) should access `args.path` directly rather than calling `parseArgs`, which also validates and creates the components directory.

## Commands

| Command | File | CMS required |
| --- | --- | --- |
| `cms:version` | `cms_info.ts` | yes |
| `cms:reset` | `cms_reset.ts` | yes |
| `project:migrate` | `migrate.ts` | no |
| `project:ai` | `project_ai.ts` | no |
| `nextjs:create` | `nextjs_create.ts` | yes |
| `nextjs:components` | `nextjs_components.ts` | yes |
| `nextjs:factory` | `nextjs_factories.ts` | yes |
| `nextjs:fragments` | `nextjs_fragments.ts` | yes |
| `nextjs:queries` | `nextjs_queries.ts` | yes |
| `nextjs:visualbuilder` | `nextjs_visualbuilder.ts` | yes |
| `schema:download` | `schema_download.ts` | yes |
| `schema:list` | `schema_list.ts` | yes |
| `schema:validate` | `schema_validate.ts` | yes |
| `schema:vscode` | `schema_vscode.ts` | yes |
| `style:create` | `style_create.ts` | yes |
| `styles:list` | `styles_list.ts` | yes |
| `styles:pull` | `styles_pull.ts` | yes |
| `styles:push` | `styles_push.ts` | yes |
| `styles:delete` | `styles_delete.ts` | yes |
| `types:pull` | `types_pull.ts` | yes |
| `types:push` | `types_push.ts` | yes |

### `project:ai` — AI assistant configuration

Scans `node_modules/@remkoj` for installed packages that ship an `AGENTS.md` and writes/merges four output files in the consumer project:

| Output file | Strategy |
| --- | --- |
| `AGENTS.md` | Created on first run; subsequent runs replace the `<!-- @remkoj/optimizely-packages:start/end -->` section in-place |
| `CLAUDE.md` | Created if absent; skipped if present unless `--force` is passed |
| `.vscode/instructions/remkoj-<name>.instructions.md` | One file per package; each contains a `#file:` reference to `node_modules/@remkoj/<name>/AGENTS.md`. VS Code Copilot resolves `#file:` references at query time. Stale files from previous runs are removed automatically. |
| `.cursor/rules/optimizely-packages.mdc` | Always (re)written — contains a markdown link list referencing each package's AGENTS.md |

The command also removes the deprecated `github.copilot.chat.codeGeneration.instructions` key from `.vscode/settings.json` if it was written by an older run.

Options: `--force` / `-f` (replace files entirely), `--tools` / `-t` (limit outputs to `agents`, `claude`, `copilot`, `cursor`).
