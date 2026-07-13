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

```typescript
import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: [{ [`${process.env.OPTIMIZELY_GRAPH_GATEWAY}/content/v2`]: {
    headers: { Authorization: `epi-single ${process.env.OPTIMIZELY_GRAPH_SINGLE_KEY}` }
  }}],
  documents: ['src/**/*.{ts,tsx,graphql}'],
  generates: {
    'src/gql/': {
      preset: 'client',
      presetConfig: { fragmentMasking: false },
      plugins: ['@remkoj/optimizely-graph-functions'],
      config: {
        // List of Optimizely Graph built-in functions to expose as typed operations
        functions: ['getContentType', 'getContentByPath', 'getContentById']
      }
    }
  }
}

export default config
```

## Plugin options (`PluginOptions`)

| Option | Default | Description |
| --- | --- | --- |
| `functions` | `['getContentType', 'getContentByPath', 'getContentById']` | Optimizely Graph built-in functions to generate typed wrappers for |
| `prettyPrintQuery` | `false` | Format generated query strings |
| `clientPath` | `"./graphql"` | Path to the generated GraphQL client |

## Constraints

- Requires `@graphql-codegen/cli` and `@graphql-codegen/client-preset` as peer dependencies.
- Depends on a **patched** `@graphql-codegen/visitor-plugin-common`; after `yarn install`/`upgrade` run `yarn opti-graph patches:apply`.
- CommonJS module.
