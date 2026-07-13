# @remkoj/optimizely-graph-functions — usage

`graphql-codegen` preset and plugin for Optimizely Graph. Generates typed GraphQL
operations and fragments for querying Optimizely Content Graph.

## Install

```bash
npm install --save-dev @remkoj/optimizely-graph-functions
```

## Subpath exports

| Import path | Contents |
| --- | --- |
| `@remkoj/optimizely-graph-functions` | Plugin entry point (`plugin`, `validate`) |
| `@remkoj/optimizely-graph-functions/preset` | Codegen preset (primary entrypoint for codegen config) |
| `@remkoj/optimizely-graph-functions/plugin` | Standalone codegen plugin |
| `@remkoj/optimizely-graph-functions/transform` | Document transform |
| `@remkoj/optimizely-graph-functions/documents` | Shared Optimizely Graph fragment documents |
| `@remkoj/optimizely-graph-functions/loader` | GraphQL document loader |
| `@remkoj/optimizely-graph-functions/contenttype-loader` | Content-type aware loader |
| `@remkoj/optimizely-graph-functions/generate` | Code generation utilities |

## Usage in `codegen.ts`

The package exposes a full codegen **preset** (not just a plugin). Use it as the `preset` value for your output target. The preset auto-discovers your component GraphQL files and injects the right fragments based on the file-name convention below.

```typescript
import type { CodegenConfig } from '@graphql-codegen/cli'
import getSchemaInfo from '@remkoj/optimizely-graph-client/codegen'
import OptimizelyGraphPreset, { type PresetOptions } from '@remkoj/optimizely-graph-functions/preset'

const config: CodegenConfig = {
  schema: getSchemaInfo(),             // reads env vars automatically
  documents: ['src/**/*.graphql'],
  generates: {
    './gql/': {
      preset: OptimizelyGraphPreset,
      presetConfig: {
        // Allow recursive fragments (requires patched visitor-plugin-common)
        recursion: true,

        // Map component GraphQL files to the correct base fragment
        injections: [
          { into: 'PageData',         pathRegex: 'src\/components\/cms\/.*\.page\.graphql' },
          { into: 'PageData',         pathRegex: 'src\/components\/cms\/.*\.experience\.graphql' },
          { into: 'BlockData',        pathRegex: 'src\/components\/cms\/.*\.block\.graphql' },
          { into: 'BlockData',        pathRegex: 'src\/components\/cms\/.*\.component\.graphql' },
          { into: 'BlockData',        pathRegex: 'src\/components\/cms\/.*\.section\.graphql' },
          { into: 'ElementData',      pathRegex: 'src\/components\/cms\/.*\.element\.graphql' },
          { into: 'IContentListItem', pathRegex: 'src\/components\/cms\/.*\.contentarea\.graphql' },
        ],
      } as PresetOptions,
    },
  },
}

export default config
```

## GraphQL file naming conventions

Files discovered by `injections.pathRegex` are automatically injected into the named base fragment:

| File suffix | Injected into |
| --- | --- |
| `*.page.graphql` | `PageData` |
| `*.experience.graphql` | `PageData` |
| `*.block.graphql` | `BlockData` |
| `*.component.graphql` | `BlockData` |
| `*.section.graphql` | `BlockData` |
| `*.element.graphql` | `ElementData` |
| `*.contentarea.graphql` | `IContentListItem` |

Each file should contain a single named fragment that matches its content type, e.g. `fragment HeroBlockData on HeroBlock { ... }`.

## Preset options (`PresetOptions`)

`PresetOptions` extends `ClientPresetConfig` (from `@graphql-codegen/client-preset`) with:

| Option | Default | Description |
| --- | --- | --- |
| `functions` | `['getContentType', 'getContentByPath', 'getContentById']` | Built-in Optimizely Graph functions to generate typed wrappers for |
| `prettyPrintQuery` | `false` | Format generated query strings |
| `clientPath` | `"./graphql"` | Path to the generated GraphQL client |
| `recursion` | `false` | Enable recursive fragment support (requires patched `visitor-plugin-common`) |
| `injections` | `[]` | Array of `{ into, pathRegex?, nameRegex? }` injection rules |
| `cleanup` | `true` | Strip injected fragment spreads after processing |

## Loading Optimizely-provided fragments

The loader protocol `opti-cms:/fragments/13` fetches the built-in Optimizely Graph fragments (the preset adds this automatically; you normally do not need to add it manually):

```typescript
// Only needed when building a custom codegen target that references Optimizely fragments
{ 'opti-cms:/fragments/13': { loader: '@remkoj/optimizely-graph-functions/loader' } }
```

## Constraints

- Requires `@graphql-codegen/cli` and `@graphql-codegen/client-preset` as peer dependencies.
- Depends on a **patched** `@graphql-codegen/visitor-plugin-common`; after `yarn install`/`upgrade` run `yarn opti-graph patches:apply`.
- CommonJS module.
- Use the preset (`./preset`) as the entry point, not the bare plugin, for all new projects.
