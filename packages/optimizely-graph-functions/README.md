# Optimizely GraphQL Codegen Plugin  <!-- omit in toc -->
GraphQL Codegen plugin and preset which generate both the GraphQL type definitions and a few convenienece methods for useage with [Optimizely Graph Client](../optimizely-graph-client/README.md).

[Release notes](https://github.com/remkoj/optimizely-dxp-clients/releases)

> [!WARNING]
> The GraphQL Codegen preset requires a patch to enable it to work with recursive queries. Make sure to run this command after every update to ensure you're using the latest patches: `yarn opti-graph patches:apply`. Adjust when used in a mono-repo to patch the correct package.json, for example: `yarn workspace frontend opti-graph patches:apply -p ../../`

## Contents  <!-- omit in toc -->
- [1. Install package](#1-install-package)
- [2. Configure package](#2-configure-package)
- [3. GraphQL Document Processing](#3-graphql-document-processing)
  - [3.1. Allow overwriting of built-in fragments \& queries](#31-allow-overwriting-of-built-in-fragments--queries)
  - [3.2. Injection of fragments \& queries for ContentTypes](#32-injection-of-fragments--queries-for-contenttypes)
  - [3.3. Auto inject fragments](#33-auto-inject-fragments)
  - [3.4. Remove fragments and spreads that target non-existing types](#34-remove-fragments-and-spreads-that-target-non-existing-types)
  - [3.5. Dedicated Queries \& Fragments](#35-dedicated-queries--fragments)
  - [Compiler field directive `@depend`](#compiler-field-directive-depend)
- [4. Usage](#4-usage)
  - [4.1. Option 1: Direct methods](#41-option-1-direct-methods)
  - [4.2. Option 2: Enhanced Client](#42-option-2-enhanced-client)


## 1. Install package
To install using Yarn, use the following command:

```bash
yarn add --dev @remkoj/optimizely-graph-functions
```

To add support for automatic applying of patches and apply them.
```bash
yarn add --dev @remkoj/optimizely-graph-cli
yarn opti-graph patches:apply
```

## 2. Configure package
Create a codegen.ts within your application root folder (e.g. apps/frontend/codegen.ts within the example site). Within the codegen.ts create the following configuration:

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
      injections: [
        { into: 'PageData',      pathRegex: 'src\/components\/cms\/.*\.page\.graphql$' },
        { into: 'PageData',      pathRegex: 'src\/components\/cms\/.*\.experience\.graphql$' },
        { into: 'ComponentData', pathRegex: 'src\/components\/cms\/.*\.block\.graphql$' },
        { into: 'ComponentData', pathRegex: 'src\/components\/cms\/.*\.component\.graphql$' },
        { into: 'ComponentData', pathRegex: 'src\/components\/cms\/.*\.section\.graphql$' },
        { into: 'ElementData',   pathRegex: 'src\/components\/cms\/.*\.element\.graphql$' },
      ],
    }),
  },
}

export default config
```

`OptimizelyGraphPreset.createOutputConfig()` is the recommended API — it wires up document transforms automatically. The options it accepts extend the [Client Preset](https://the-guild.dev/graphql/codegen/plugins/presets/preset-client) configuration with:

| Option | Default | Description |
| --- | --- | --- |
| `gqlTagName` | `'gql'` | Tag function used to identify inline GraphQL queries in TypeScript source files |
| `recursion` | `false` | Enable recursive queries. Requires a patched `@graphql-codegen/visitor-plugin-common`; run `yarn opti-graph patches:apply` after every install or upgrade |
| `injections` | `[]` | Rules that map GraphQL files or fragment names to injection targets (`into`, `pathRegex`, `nameRegex`). Valid targets: `PageData`, `ComponentData`, `SectionData`, `ElementData`, `SectionElementData`, `FormElementData`, `MediaData`, `BlockData` (deprecated) |
| `functions` | `['getContentType',` `'getContentByPath',` `'getContentById']` | GraphQL functions to expose in `functions.ts`. Overrides the default list |
| `prettyPrintQuery` | `false` | Pretty-print the inlined query string inside each generated function |
| `cleanup` | `true` | Remove injected fragment spreads after processing. Pass `string[]` to remove only specific spreads |
| `verbose` | `false` | Enable debug output and generate `opti.generated.graphql` showing all built-in and auto-generated queries |
| `documents` | _(built-in)_ | Standard preset documents. Built-in sources: `opti-cms:/queries/13` and `opti-cms:/fragments/13` (included by default), `opti-cms:/queries/12`, `opti-cms:/fragments/12`. Defaults apply only when no `opti-cms:` document is explicitly defined |

## 3. GraphQL Document Processing
### 3.1. Allow overwriting of built-in fragments & queries
All fragment and query names injected / generated by this package start with an underscore (for example: `_getContentById`). During the document pre-processing, all these fragments and queries will be processed with this logic:
- If there's no query or fragment with the name without the leading underscore, it will be renamed. (i.e. `_getContentById` becomes `getContentById`)
- If a query or fragment with the name without leading underscore does exist, the built-in version with underscore will be removed from the document set.

This renaming happens **before** `@graphql-codegen/client-preset` captures the document strings, so the final (un-prefixed) names are reflected in both `graphql.ts` and `gql.ts`.

This allows a project to overwrite built-in fragments and queries, while still ensuring type-safety.

### 3.2. Injection of fragments & queries for ContentTypes
For each content type the appropriate fragments and queries will be auto generated an injected into the document set.

### 3.3. Auto inject fragments
Dynamically build queries & fragments based upon the `injections` configuration, and the default injections from the auto-generated fragments & queries.

This allows you to tell wich group of fragments you want at a given location and then during GraphQL compilation generate the full queries based upon the current content schema in Optimizely CMS and your project configuration.

### 3.4. Remove fragments and spreads that target non-existing types
Depending on the features you have enabled in your CMS, not all types might actually be present in Optimizely Graph. This logic removes these fragments and spreads from the `opti-cms:/` virtual documents generated by the preset.

User-authored files are intentionally left untouched — missing types or fields in hand-written fragments will surface as TypeScript compilation errors, which is the correct feedback loop for project code.

### 3.5. Dedicated Queries & Fragments
The preset automatically injects a number of fragments and documents into the generated code. These can be found in their respective document:

- [`opti-cms:/queries/13`](./src/documents/queries.cms13.ts)
- [`opti-cms:/queries/12`](./src/documents/queries.cms12.ts)
- [`opti-cms:/fragments/13`](./src/documents/fragments.cms13.ts)
- [`opti-cms:/fragments/12`](./src/documents/fragments.cms12.ts)

### Compiler field directive `@depend`
A compile time directive `@depend` is processed, allowing you to make selections depend on a field to present in the schema.

For example: `componentData: item @depend(on: "ContentReference.item") {}` will remove the field selection `componentData` from the document if there's no type with the name `ContentReference` that has a field named `item`.

This allows to write generic queries that can cope with differen configurations within the CMS.

## 4. Usage
After running the code generation, you can use the following API's (assuming the folder where the generated files are stored is available at `@/gql`):

### 4.1. Option 1: Direct methods
Only the methods specified by the `functions` preset configuration are available using this method.

```typescript
import { getContentById, getContentByPath } from "@/gql/functions"
import createClient from "@remkoj/optimizely-graph-client"

const client = createClient({
    single_key: "your single key here"
})

const contentFromId = await getContentById(client, { guidValue: '00000000-0000-0000-0000-000000000000', locale: 'en' })
const contentFromPath = await getContentByPath(client, { path: '/en' })
```

### 4.2. Option 2: Enhanced Client
All GraphQL operations (e.g. Queries, Mutations, ...) defined within the documents are available using this method.

```typescript
import { getSdk } from "@/gql/client"
import createClient from "@remkoj/optimizely-graph-client"

const client = getSdk(createClient({
    single_key: "your single key here"
}))
const contentId = '00000000-0000-0000-0000-000000000000'
const locale = Schema.Locales.En

const contentItem = await client.getContentById({ guidValue: contentId, locale })
```
