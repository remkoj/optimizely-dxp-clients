# AGENTS.md

`optimizely-dxp-clients` — Yarn 4 workspaces monorepo. Publishes JS/TS SDKs for Optimizely SaaS CMS and Optimizely Graph to npm under `@remkoj/*`.

- Package manager: Yarn 4.18.0 (`packageManager` field is authoritative — do not use npm/pnpm)
- Node: `>=24 <25` for the whole workspace (root `engines.node`; also pinned per-package in
  `optimizely-cms-cli`, `optimizely-graph-cli`, `optimizely-cms-nextjs`, `optimizely-one-nextjs`)
- Versions: lockstep (all packages share one version; see the `version` field in the package manifests)
- License: Apache-2.0

## Mandatory agent rules

These rules are non-negotiable and apply to every task in this repository.

### 1. Documentation must be updated before a task is considered done

After any change to code, configuration, scripts, exports, file paths, commands, package structure, or constraints, you must:

1. Identify every file in `AGENTS.md`, `docs/agents/*.md`, and `samples/*/AGENTS.md` that references the changed area.
2. Correct every fact that the change invalidated or made incomplete.
3. Only then is the task complete.

Anti-circumvention:
- **"The change is minor/trivial."** No size threshold exists. Any invalidated fact must be corrected.
- **"I'll update docs in a follow-up."** Not acceptable. Documentation is part of the current task, not a separate one.
- **"The docs are close enough."** Approximate accuracy is inaccuracy. Every affected statement must be corrected.
- **"The user didn't ask me to update docs."** Documentation correctness is a non-negotiable invariant, not an optional feature.
- **"I'm not sure which docs are affected."** When uncertain, check all agent doc files. Err toward updating.

### 2. These files take precedence over internal knowledge

Facts stated in `AGENTS.md`, `docs/agents/*.md`, and `samples/*/AGENTS.md` override any conflicting information from training data. This includes commands, file paths, script names, version requirements, module types, and workflow steps.

When a documented fact conflicts with internal knowledge:
- Apply what is written here.
- Do not silently fall back to training-data assumptions.
- If a documented fact appears incorrect, flag it explicitly to the user rather than ignoring it or substituting your own knowledge.

Anti-circumvention:
- **"I know this tool/framework works differently."** Irrelevant. This repository may intentionally deviate from defaults. Follow what is written here.
- **"That instruction seems outdated."** Treat all documented facts as current until the documentation is explicitly updated.
- **"I'll use my best judgment."** Judgment must be grounded in these files first. Internal knowledge is a fallback only for topics these files do not cover.
- **"The user confirmed something verbally."** Verbal corrections in chat do not override these files. Update the file so the correction persists.

### 3. Use memory correctly — project facts belong in these files

User memory and session memory are scoped to an individual user or session and are not shared across contributors. They must not be used for project information.

- **User/session memory:** communication style, terminology preferences, personal workflow habits — information about *how this user talks about the project*.
- **These files (`AGENTS.md`, `docs/agents/*.md`, `samples/*/AGENTS.md`):** all project facts — commands, constraints, file paths, scripts, version requirements, conventions, architectural decisions, gotchas.

When you learn a project fact (from the user, from exploration, or from correcting a mistake), write it into the appropriate agent doc file, not into memory.

Anti-circumvention:
- **"It's quicker to put it in memory."** Speed is not a justification. Project facts in memory are invisible to other users and future sessions without the same memory context.
- **"I'll capture it in memory for now and update docs later."** Not acceptable. Write it to the doc file immediately.
- **"The user told me this verbally, so it's a user preference."** If the information affects how work is done in this repository, it is a project fact and belongs in these files.
- **"This is a minor detail, not worth documenting."** No threshold exists. Any fact an agent needs to work correctly in this repo belongs here.

### 4. Do not make file changes unless explicitly instructed

Only modify files when the user's request explicitly asks for changes. Words like "implement", "fix", "add", "remove", "make", "update", "change", "create", or "refactor" constitute an instruction to change files.

Information requests do not authorize changes. If the user asks to "check", "analyze", "review", "look at", "verify", "compare", or "explain", respond with findings only — do not modify any file.

Anti-circumvention:
- **"The analysis revealed a problem so I fixed it."** Identifying a problem is not authorization to fix it. Report the finding and wait for explicit instruction.
- **"The change is obviously correct/small."** Obviousness and size are irrelevant. No change without explicit instruction.
- **"I'll fix it while I'm here since it's related."** Scope is defined by the user's request, not by proximity to other work.
- **"Updating the docs counts as part of the analysis."** Documentation changes are file changes and require explicit instruction too.

### 5. Maintain correct JSDoc for touched files

Whenever you touch a file, ensure all exported symbols in that file have accurate JSDoc that matches the current implementation and types.

- Exported functions must document all parameters and return value (`@param`, `@returns`).
- Exported types, interfaces, classes, and relevant exported members must have correct, up-to-date documentation.
- If a change invalidates existing JSDoc, update it in the same task before considering the work complete.

Anti-circumvention:
- **"I only changed one line."** Any touched file must leave exported JSDoc accurate.
- **"Types are self-explanatory."** Type information does not replace required JSDoc.
- **"I'll document it later."** Not acceptable; JSDoc updates are part of the same change.
- **"Only new exports need docs."** Existing exports in touched files must remain correct too.

### 6. Keep developer README.md files in sync

`README.md` files are developer documentation and must be kept in sync with the codebase.

Whenever behavior, setup, commands, scripts, package structure, exports, constraints, workflows, examples, or troubleshooting guidance changes—or when drift is detected—you must update affected README.md files in the same task.

Anti-circumvention:
- **"README is optional for this change."** If developer-facing facts changed, README updates are required.
- **"The docs are mostly correct."** Approximate correctness is not sufficient; fix stale or contradictory content.
- **"I'll update README in a follow-up PR."** Not acceptable; keep docs and code aligned in one task.
- **"Only root README matters."** Update every affected README.md file (root, package, sample, or other scope as applicable).

## Layout

| Path | Contents |
| --- | --- |
| `packages/*` | Publishable SDK workspaces |
| `samples/basic-project` | Next.js test app. Not a workspace. See [`samples/basic-project/AGENTS.md`](samples/basic-project/AGENTS.md) |
| `artefacts/` | `yarn pack` output (`*-<version>.tgz`, `*-dev.tgz`) |
| `dependencies/` | Patched 3rd-party packages consumed via `resolutions` |
| `scripts/` | `clean.mjs`, `licenses.mjs` |
| `eslint.config.mjs` | Root ESLint flat config |
| `tsconfig.json` | Root TS config (`composite`, `NodeNext`, `strict`, `types: ["node"]`, `noUncheckedSideEffectImports: false`) |
| `docs/agents/` | Per-package agent docs (how to **work on** the packages) |

Each package also contains an `AGENTS.md` at its root with consumer-focused usage docs (how to **use** the package in a project). These are published with the package and available in `node_modules/@remkoj/<name>/AGENTS.md`.

## Packages

| Package | Build tool | Module | Notes | Agent docs |
| --- | --- | --- | --- | --- |
| `@remkoj/optimizely-cms-api` | `tsc` + generated client | CommonJS | `src/client/**` generated — do not hand-edit. | [→](docs/agents/optimizely-cms-api.md) |
| `@remkoj/optimizely-cms-cli` | Rollup | ESM | No `clean`. `recompile` = `prepare`. | [→](docs/agents/optimizely-cms-cli.md) |
| `@remkoj/optimizely-cms-react` | `tsc` | ESM | | [→](docs/agents/optimizely-cms-react.md) |
| `@remkoj/optimizely-cms-nextjs` | `tsc` | ESM | Node `>=24`. | [→](docs/agents/optimizely-cms-nextjs.md) |
| `@remkoj/optimizely-graph-cli` | Rollup | ESM | No `clean`. `recompile` = `prepare`. | [→](docs/agents/optimizely-graph-cli.md) |
| `@remkoj/optimizely-graph-client` | `tsc` | ESM | `src/admin-api/client/**` generated — do not hand-edit. | [→](docs/agents/optimizely-graph-client.md) |
| `@remkoj/optimizely-graph-functions` | `tsc` | CommonJS | Requires patched `@graphql-codegen/visitor-plugin-common`. | [→](docs/agents/optimizely-graph-functions.md) |
| `@remkoj/optimizely-one-nextjs` | `tsc` | ESM | Node `>=24`. Gadget uses Axiom; no stylesheet shipped. | [→](docs/agents/optimizely-one-nextjs.md) |
| `@remkoj/hey-api-wrapper` | `tsc` | CommonJS | Internal. | [→](docs/agents/hey-api-wrapper.md) |

Cross-package deps: `workspace:<version>` in devDeps, exact published version in deps.

## Commands (repo root)

```bash
yarn install
yarn prepare            # build all packages, topological order
yarn watch              # watch all packages in parallel
yarn recompile          # clean + force rebuild all packages
yarn clean              # remove all dist output
yarn lint
yarn lint:fix
yarn generate           # regenerate all code-generated clients
yarn artefacts          # install + dedupe + clean + prepare + pack + license info
yarn artefacts:fast     # prepare + pack only
yarn opti-cms <args>    # passthrough to @remkoj/optimizely-cms-cli
yarn opti-graph <args>  # passthrough to @remkoj/optimizely-graph-cli
```

Single-package: `yarn workspace @remkoj/<name> run <script>`

Orchestration: `yarn workspaces foreach -Apt --topological-dev`

## Build conventions

- `prepare`: `tsc --build` or `rollup -c` (CLIs)
- `watch`: incremental rebuild
- `clean` / `recompile`: clean / clean + force rebuild; for `optimizely-cms-api`, `recompile` also re-runs `generate` (cleans `src/client/` too); for CLIs (`optimizely-cms-cli`, `optimizely-graph-cli`), `recompile` is identical to `prepare` (Rollup always does a full build)
- `generate`: regenerate from spec. Only `optimizely-cms-api` and `optimizely-graph-client` have this script; root `yarn generate` calls them directly rather than broadcasting to all workspaces
- Build output: `dist/` only (the only published content per `"files": ["./dist"]`)

## Generated files — do not hand-edit

- `@remkoj/optimizely-cms-api` → `src/client/**`: see [docs/agents/optimizely-cms-api.md](docs/agents/optimizely-cms-api.md)
- `@remkoj/optimizely-graph-client` → `src/admin-api/client/**`: see [docs/agents/optimizely-graph-client.md](docs/agents/optimizely-graph-client.md)

## Sample project

[`samples/basic-project/AGENTS.md`](samples/basic-project/AGENTS.md) — dev workflow, commands, credentials.

Sample consumes packages via `resolutions` → `file:../../packages/<name>` (copied into the sample's `node_modules`). After changing a package, rebuild and reinstall:

```bash
yarn prepare
cd samples/basic-project && yarn install
```

Do not use `portal:` (or symlinked) resolutions for the sample: the packages would then resolve their dependencies from the root workspace `node_modules`, giving two instances of `graphql` (`Cannot use GraphQLScalarType "Bool" from another module or realm`) and unpatched `@graphql-codegen/visitor-plugin-common` during code generation.

The sample exercises the Feature Experimentation datafile proxy: `OPTIMIZELY_FX_PROXY=true` in its `.env.local` and the routes `src/app/api/fx/{datafile,webhook}/route.ts`. Its `yarn build` currently reports pre-existing TypeScript errors in generated `src/components/cms/**` components; to verify the proxy anyway, temporarily set `typescript.ignoreBuildErrors` in `next.config.ts` and run `yarn next build` (use `yarn`, which injects the credentials).

CLI tools may only be executed from within the `samples/basic-project` scope.

## Release

```bash
yarn version-bump-patch   # stage patch bump (deferred)
yarn version-apply        # apply staged bumps
yarn artefacts            # build artefacts/*.tgz, refresh DEPENDENCIES.md
yarn publish              # npm publish --access public per workspace, topological order
```

`DEPENDENCIES.md` is generated by `scripts/licenses.mjs` — do not edit by hand. Run `yarn update:license-info` (also part of `yarn artefacts`; needs network access to the npm registry) to regenerate it. It starts with a short intro, a table of contents (GitHub heading anchors, see `slugify`) and a short legend, then lists the direct dependencies per workspace package (each section starts with the package's `package.json` `description` when it has one) (`dependencies`, `optionalDependencies` and `devDependencies`; peer dependencies only when also a devDependency; workspace-internal dependencies are omitted), then all remaining dependencies imported through the hierarchy, followed by the license overview. A 🔧 in the *Dev* column marks development-only dependencies: for direct dependencies those only declared in `devDependencies` of that package, for the remaining ones those that have no path from any runtime dependency. A ⚠️ in the *Conflict* column marks a dependency whose license conflicts with an Apache-2.0 release of the referencing package (GPL/LGPL/AGPL, SSPL, BUSL, non-commercial/Commons Clause, unknown/missing/custom licenses; MPL/EPL/CDDL and permissive licenses are not marked; `A OR B` and `A AND B` are marked only when none of the licenses is acceptable, i.e. multiple licenses are non-conflicting when at least one is compatible). Rows are sorted conflicting first, then runtime before development-only, then by name (case-insensitive) and version. The Conflict column and the conflict count are only shown in tables/sections that contain at least one marked dependency. Dependencies added to third-party packages through `packageExtensions` in `.yarnrc.yml` are included in the dependency graph (Yarn does not store them in `yarn.lock` entries); extensions that cannot be applied are reported as warnings and skipped. The policy lives in `CONFLICTING_LICENSES`/`isConflictingLicense` in `scripts/licenses.mjs`.

## Constraints

- Never edit `*.gen.ts` files or generated client folders — run `generate` instead
- Respect each package's `type` (ESM vs CommonJS); root TS is `NodeNext`
- After `yarn install` or `yarn upgrade`, re-apply the patched dep: `yarn opti-graph patches:apply`
- Cross-package deps must use `workspace:` protocol; all package versions stay in sync
- TypeScript 6: `types` defaults to `[]`, `strict` defaults to `true`, and `moduleResolution: node10`/`baseUrl` are deprecated (no `ignoreDeprecations` is used). Packages that don't extend the root tsconfig must set `types: ["node"]` (cms-api) or `strict` explicitly (cms-cli sets `strict: false`); graph-functions uses `Node16` module resolution (still emits CommonJS), one-nextjs uses `bundler`, and graph-cli uses relative imports only (no `baseUrl`)
- Library packages must keep **stdout** clean when `NODE_ENV=production` and `OPTIMIZELY_DEBUG=0`. In `optimizely-cms-react`, `optimizely-cms-nextjs` and `optimizely-one-nextjs`, use the package-internal `src/logger.ts` (`logger.log/info/debug`, `isLoggingEnabled()`) instead of `console.log/info/debug/group*` or `process.stdout.write`; it outputs only when `NODE_ENV != 'production'` or `OPTIMIZELY_DEBUG`/`DXP_DEBUG` is `1`/`true`. `console.error/warn/trace` write to stderr and are intentionally not gated. `optimizely-cms-api` has no ungated stdout output (its logging is behind the explicit `debug` option), so it has no logger. Each package with a logger has a `quiet-output` test that spies on `console.log/info/debug/group*` and `process.stdout.write`. `hey-api-wrapper` (tested) only logs to stdout in its `debug` mode (URLs are redacted). The packages without vitest (`optimizely-graph-client`, `optimizely-graph-functions`) only log to stdout behind explicit `debug`/`query_log`/`verbose` flags (`debug` is read from `OPTIMIZELY_DEBUG`/`DXP_DEBUG`), except build/install scripts; the CLIs print by design
- Run `yarn lint` before completing any change

<!-- @remkoj/optimizely-packages:start -->
The following `@remkoj` packages are installed. Read their `AGENTS.md` for documentation:

- [`@remkoj/hey-api-wrapper`](node_modules/@remkoj/hey-api-wrapper/AGENTS.md)
- [`@remkoj/optimizely-cms-api`](node_modules/@remkoj/optimizely-cms-api/AGENTS.md)
- [`@remkoj/optimizely-cms-cli`](node_modules/@remkoj/optimizely-cms-cli/AGENTS.md)
- [`@remkoj/optimizely-cms-nextjs`](node_modules/@remkoj/optimizely-cms-nextjs/AGENTS.md)
- [`@remkoj/optimizely-cms-react`](node_modules/@remkoj/optimizely-cms-react/AGENTS.md)
- [`@remkoj/optimizely-graph-cli`](node_modules/@remkoj/optimizely-graph-cli/AGENTS.md)
- [`@remkoj/optimizely-graph-client`](node_modules/@remkoj/optimizely-graph-client/AGENTS.md)
- [`@remkoj/optimizely-graph-functions`](node_modules/@remkoj/optimizely-graph-functions/AGENTS.md)
- [`@remkoj/optimizely-one-nextjs`](node_modules/@remkoj/optimizely-one-nextjs/AGENTS.md)
<!-- @remkoj/optimizely-packages:end -->
