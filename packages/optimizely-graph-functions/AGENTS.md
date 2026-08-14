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

The package exposes a full codegen **preset** (not just a plugin). Use `OptimizelyGraphPreset.createOutputConfig()` to configure the output target — this wires up document transforms automatically.

```typescript
import type { CodegenConfig } from '@graphql-codegen/cli'
import getSchemaInfo from '@remkoj/optimizely-graph-client/codegen'
import { OptimizelyGraphPreset } from '@remkoj/optimizely-graph-functions/preset'

const config: CodegenConfig = {
  schema: getSchemaInfo(),
  documents: [
    'src/app/**/*.graphql',
    'src/components/cms/**/*.graphql',
    'src/app/**/*.(ts|tsx)',
    'src/components/cms/**/*.(ts|tsx)',
  ],
  ignoreNoDocuments: true,
  allowPartialOutputs: true,
  generates: {
    'src/gql/': OptimizelyGraphPreset.createOutputConfig({
      gqlTagName: 'graphql',
      recursion: true,

      // functions: ['getContentByPath', 'getContentById'],  // override default typed wrappers
      // prettyPrintQuery: true,                             // pretty-print inlined query strings
      // verbose: true,                                      // generate opti.generated.graphql

      injections: [
        { into: 'PageData',       pathRegex: 'src\/components\/cms\/.*\.page\.graphql' },
        { into: 'PageData',       pathRegex: 'src\/components\/cms\/.*\.experience\.graphql' },
        { into: 'ComponentData',  pathRegex: 'src\/components\/cms\/.*\.block\.graphql' },
        { into: 'ComponentData',  pathRegex: 'src\/components\/cms\/.*\.component\.graphql' },
        { into: 'ComponentData',  pathRegex: 'src\/components\/cms\/.*\.section\.graphql' },
        { into: 'ElementData',    pathRegex: 'src\/components\/cms\/.*\.element\.graphql' },
      ],
    }),
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
| `*.block.graphql` | `ComponentData` |
| `*.component.graphql` | `ComponentData` |
| `*.section.graphql` | `ComponentData` |
| `*.element.graphql` | `ElementData` |
| `*.contentarea.graphql` | `IContentListItem` |

Each file should contain a single named fragment that matches its content type, e.g. `fragment HeroBlockData on HeroBlock { ... }`.

As a shorthand, fragments in a file whose name includes a target name just before the extension are auto-included — e.g. `HeroBlock.ComponentData.ElementData.graphql` injects all its fragments into both `ComponentData` and `ElementData`.

### Valid injection targets

| Target | Description |
| --- | --- |
| `PageData` | Page and experience types (`_page` / `_experience` baseType) |
| `ComponentData` | General-purpose components and blocks (`_component` baseType). Replaces `BlockData`. |
| `SectionData` | Visual Builder section layout types (`_section` baseType) |
| `ElementData` | Components with the `elementEnabled` composition behavior |
| `SectionElementData` | Components with the `sectionEnabled` composition behavior |
| `FormElementData` | Components with the `formsElementEnabled` composition behavior |
| `MediaData` | Media asset types (`_media` / `_image` / `_video` baseType) |
| `BlockData` | **Deprecated** alias for `ComponentData` |

## Preset options (`PresetOptions`)

`PresetOptions` extends `ClientPresetConfig` (from `@graphql-codegen/client-preset`) with:

| Option | Default | Description |
| --- | --- | --- |
| `gqlTagName` | `'gql'` | Tag function used to identify inline GraphQL queries in TypeScript source files |
| `functions` | `['getContentType', 'getContentByPath', 'getContentById']` | Names of the Optimizely Graph queries to expose as typed wrapper functions in `functions.ts` |
| `prettyPrintQuery` | `false` | Pretty-print the inlined query string inside each generated function |
| `clientPath` | `"./graphql"` | Import path to the generated GraphQL client module |
| `recursion` | `false` | Enable recursive fragment support (requires patched `visitor-plugin-common`) |
| `injections` | `[]` | Array of `{ into, pathRegex?, nameRegex? }` rules mapping files or fragment names to injection targets |
| `cleanup` | `true` | Strip injected fragment spreads after processing; pass a `string[]` to remove only specific spread names |
| `verbose` | `false` | Enable debug output and generate `opti.generated.graphql` showing all built-in and auto-generated queries |

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
- Transforms that exclusively affect `opti-cms:/` virtual documents (name normalisation, fragment/spread cleanup) are applied directly inside the preset before `@graphql-codegen/client-preset` captures document strings — ensuring renamed names appear correctly in both `graphql.ts` and `gql.ts`. Transforms that can affect user-authored files (`performInjections`, `handleDependDirective`) run as registered `documentTransforms`.
