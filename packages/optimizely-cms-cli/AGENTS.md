# @remkoj/optimizely-cms-cli — usage

CLI tool for Optimizely SaaS CMS. Provides the `opti-cms` binary.

## Install

```bash
npm install --save-dev @remkoj/optimizely-cms-cli
```

Requires Node `>=24.0.0 <25.0.0`.

After each install or upgrade, a `postinstall` hook automatically runs `opti-cms project:ai` to create or refresh AI assistant configuration files in the project. The hook is silent and never blocks the install.

## Environment variables

| Variable | Description |
| --- | --- |
| `OPTIMIZELY_CMS_URL` | CMS instance URL |
| `OPTIMIZELY_CMS_CLIENT_ID` | OAuth client ID |
| `OPTIMIZELY_CMS_CLIENT_SECRET` | OAuth client secret |
| `OPTIMIZELY_DEBUG` | Set to `"1"` to enable verbose output |

## Invocation

```bash
npx opti-cms <command> [options]
# or, if installed as a devDependency:
yarn opti-cms <command> [options]
```

## Global options

| Option | Alias | Description |
| --- | --- | --- |
| `--path` | `-p` | Application root folder (default: cwd) |
| `--components` | `-c` | Path to components folder (default: `./src/components/cms`) |
| `--cms_url` | `--cu` | Optimizely CMS URL |
| `--client_id` | `--ci` | API client ID |
| `--client_secret` | `--cs` | API client secret |
| `--user_id` | `-u` | Impersonate user ID |
| `--verbose` | | Enable logging |

## Commands

| Command | Description |
| --- | --- |
| `cms:version` | Print CMS version information |
| `cms:reset` | Completely clear and reset the CMS database |
| `project:migrate` | Automate directory naming convention updates |
| `nextjs:create` | Scaffold a complete Next.js / Optimizely Graph structure |
| `nextjs:components` | Generate React components for a Next.js / Graph structure |
| `nextjs:factory` | Generate the ComponentFactory for a Next.js / Graph structure |
| `nextjs:fragments` | Generate GraphQL fragments for a Next.js / Graph structure |
| `nextjs:queries` | Generate GraphQL queries for two-query content loading |
| `nextjs:visualbuilder` | Generate Visual Builder components for a Next.js structure |
| `schema:download` | Download JSON schema files for type validation |
| `schema:list` | List all schemas available in the CMS instance |
| `schema:validate` | Validate `opti-type.json` and `opti-style.json` files |
| `schema:vscode` | Configure VS Code JSON schema validation for the project |
| `project:ai` | Create or update AI assistant config files (AGENTS.md, CLAUDE.md, GitHub Copilot, Cursor) so `@remkoj` package docs are available to the model |
| `style:create` | Create a new Visual Builder style definition |
| `styles:list` | List Visual Builder style definitions from the CMS |
| `styles:pull` | Pull Visual Builder style definitions from the CMS |
| `styles:push` | Push Visual Builder style definitions into the CMS (create/replace) |
| `styles:delete` | Remove Visual Builder style definitions from the CMS |
| `types:pull` | Pull content type definition files into the project |
| `types:push` | Push content type definitions into the CMS (create/replace) |

## `nextjs:factory` — Component Factory generation

Scans the components folder (`--components`/`-c`) recursively for `.tsx`/`.jsx` files and generates
one `ComponentTypeDictionary` (from `@remkoj/optimizely-cms-react`) per directory, culminating in a
root `index.ts` (`CmsFactory`) that is passed to `factory.registerAll(...)`.

**File discovery** — a file is included only if it has a `export default`; these are always skipped:
- Files whose name starts with `_` (partials)
- Files inside a folder named `partials`
- `loading.tsx`/`.jsx` and `suspense.tsx`/`.jsx` (reserved — see below)

**Content type key & variant** — the dictionary `type` is read from the `key` in a sibling
`*.opti-type.json`; if none is found it falls back to the PascalCase folder/file name. Multiple
files in the same content-type folder (e.g. `default.tsx`, `compact.tsx`) become separate dictionary
entries sharing the same `type` but a different `variant` (the filename; `index` → `default`).

**Client components** — a file containing `"use client"` is automatically wrapped in `next/dynamic()`
so it can still be referenced from the (server-rendered) factory.

**Lazy loading** — a sibling `loading.tsx`/`.jsx` next to a component wraps it in
`next/dynamic({ loading: <LoadingComponent> })` (Next.js lazy-loading).

**Suspense placeholders** — a sibling `suspense.tsx`/`.jsx` sets `useSuspense: true` and
`loader: <SuspensePlaceholder>` on the dictionary entry, consumed by `@remkoj/optimizely-cms-react`'s
rendering pipeline — independent from, and combinable with, the `next/dynamic` loading above.

**Nested factories** — every subdirectory gets its own factory file; parent factories import and
spread (`...someFactory`) their child factories, all the way up to the root factory.

**Regeneration guard** — generated files start with a `// @not-modified` marker comment. Once that
comment is removed (e.g. because a developer hand-edited the file), subsequent runs skip it unless
`--force`/`-f` is passed.
