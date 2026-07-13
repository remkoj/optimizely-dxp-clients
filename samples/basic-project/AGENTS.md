# samples/basic-project

> **Mandatory rules:** [../../AGENTS.md](../../AGENTS.md) governs all work in this repository, including this sample. Read and apply its mandatory agent rules (documentation currency, precedence over internal knowledge, memory usage, and no unauthorised file changes) before proceeding with any task here.

Next.js app for end-to-end testing of `@remkoj/*` packages. Not a Yarn workspace.

Consumes packages via `resolutions` → `file:` links to `../../artefacts/*-dev.tgz`. Changes in `packages/` are not visible until rebuilt and repacked.

## Dev workflow

After changing any package (all packages):

```bash
yarn artefacts:fast
cd samples/basic-project && yarn install
```

Single package:

```bash
yarn workspace @remkoj/<package-name> run prepare
yarn run pack:dev
cd samples/basic-project && yarn install
```

## Commands

```bash
yarn install          # install / pick up fresh artefacts
yarn dev              # graphql-codegen + next dev --turbopack
yarn build            # graphql-codegen + next build
yarn start            # serve production build
yarn compile          # graphql-codegen only
yarn lint
yarn lint:fix
yarn nextjs:install   # clean + codegen + opti-cms nextjs:create + eslint --fix + next build
```

## Configuration

`.env.local` (required):

```env
OPTIMIZELY_CMS_URL=https://<instance>.cms.optimizely.com
OPTIMIZELY_CMS_CLIENT_ID=<client-id>
OPTIMIZELY_CMS_CLIENT_SECRET=<client-secret>
OPTIMIZELY_GRAPH_APP_KEY=<app-key>
OPTIMIZELY_GRAPH_SECRET=<secret>
OPTIMIZELY_GRAPH_SINGLE_KEY=<single-key>
```

Optional: `OPTIMIZELY_GRAPH_GATEWAY`, `OPTIMIZELY_GRAPH_TENANT_ID`, `OPTIMIZELY_DEBUG`

## Constraints

- `opti-cms` and `opti-graph` are devDependencies — use `yarn opti-cms ...` and `yarn opti-graph ...` directly
- Uses patched `@graphql-codegen/visitor-plugin-common` from `../../dependencies/`
- `yarn nextjs:install` wipes `src/components/cms` and `src/gql` before regenerating

## Code documentation

Every exported symbol and every public field, method, or property in a type, class, or interface **must** have a JSDoc comment. The comment must be:

- **Concise** — one sentence is preferred; expand only when the behaviour is non-obvious.
- **Correct** — accurately reflects what the symbol does, not what it is named.
- **Actionable for both humans and agents** — include enough context that a reader can use or implement the symbol correctly without reading the implementation. Call out side-effects, thrown errors, expected formats, or ordering constraints when relevant.
- Written in plain English; avoid restating the type signature in prose.

```ts
/** Fetches the published content item for the given key, or `null` when not found. */
export async function getContentItem(key: string): Promise<ContentItem | null> { … }

/** ISO-8601 UTC timestamp of the last successful cache invalidation. */
publishedAt: string;
```

Omitting JSDoc from an exported or public symbol is treated as an incomplete change and must be corrected before the work is considered done.
