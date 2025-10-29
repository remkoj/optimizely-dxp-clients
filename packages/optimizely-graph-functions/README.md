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
import type { CodegenConfig  } from '@graphql-codegen/cli'
import getSchemaInfo from '@remkoj/optimizely-graph-client/codegen'
import OptimizelyGraphPreset, {type PresetOptions as OptimizelyGraphPresetOptions}  from '@remkoj/optimizely-graph-functions/preset'

// This example assumes the configuration can be read from the environment variables, make sure .env files (if you use them) are processed prior to invoking getSchemaInfo()

// Create the configuration itself
const config: CodegenConfig = {
    schema: getSchemaInfo(),
    documents: [
        // Add local GQL files
        'src/**/*.graphql',

        // Add Definitions from components
        'src/**/!(*.d).{ts,tsx}'
    ],
    generates: {
        './src/gql/': {
            preset: OptimizelyGraphPreset,
            presetConfig: {
                // By default the preset will not support recursive queries, 
                // however if your content model requires it, you can enable
                // it here.
                //
                // When setting recursion to `true` it requires additional
                // steps to work
                recursion: false,

                // The GQL tag to be used to identify inline GraphQL queries
                gqlTagName: 'gql',

                // Configure the fragments that will be spread into the utility
                // partial fragments. You can use any fragment here, however 
                // the system is designed for the following receiving 
                // fragments:
                // - PageData => For all page-level components
                // - BlockData => For everyting that can be rendered as
                //                individual component
                // - ElementData => For all element types that are useable
                //                  within Visual Builder
                injections: [
                    {
                        // Add from all Pages, as .page.graphql file
                        into: "PageData",
                        pathRegex: "src\/components\/cms\/.*\.page\.graphql$"
                    },
                    {
                        // Add from all Experiences, as .experience.graphql file
                        into: "PageData",
                        pathRegex: "src\/components\/cms\/.*\.experience\.graphql$"
                    },
                    {
                        // Add from all Blocks, as .component.graphql file
                        into: "BlockData",
                        pathRegex: "src\/components\/cms\/.*\.component\.graphql$"
                    },
                    {
                        // Add from all Elements, as .element.graphql file
                        into: "ElementData",
                        pathRegex: "src\/components\/cms\/.*\.element\.graphql$"
                    }
                ],
            } as OptimizelyGraphPresetOptions
        }
    },
    ignoreNoDocuments: false
}

export default config
```

The presetConfig of the `OptimizelyGraphPreset` is an extension of the configuration for the [Client Preset](https://the-guild.dev/graphql/codegen/plugins/presets/preset-client) of GraphQL Codegen. It adds the following configuration options:

| Configuration option | Usage |
| --- | --- |
| recursion | Set to `true` to automatically generate recursive queries to iterate down the result.<br><br>The default logic of GraphQL Codegen contains an infite loop when disabling the recursion check. To patch this, a custom resolution must be added to the root `package.json`. This resolution must set the resolution for `@graphql-codegen/visitor-plugin-common` to the patched file [provided within this repository](../../dependencies/graphql-codegen-visitor-plugin-common-v5.6.0-patched.tgz)<br/><br/>A Convenience script: `yarn patch-codegen` is available to apply these transformations automatically |
| injections | A set of rules to define how individual fragments will be used to construct the master queries. Each rule has the following options: <br/>- `into`:  The name of the Fragment to inject into<br/>- `pathRegex`: The regular expression to be applied ot the file name to see if the fragment should be included with the `into` Fragment<br/>- `nameRegex`: The regular expression to be applied to the name of the Fragment
| documents | The standard rules for preset specific documents, however there are four standard documents available:<br/>- `opti-cms:/queries/13` (included by default)<br/>- `opti-cms:/queries/12`<br/>- `opti-cms:/fragments/13` (included by default)<br/>- `opti-cms:/fragments/12`<br/>*The defaults are only applied when there's no document starting with `opti-cms:` defined*
| functions | The list of GraphQL Functions that should be made available in the `functions.ts` file. When specified, this overrides the default list.<br/>*Default value: `['getContentType','getContentByPath','getContentById']`*
| verbose | Set to `true` to enable debugging output of the preset, loader, plugin and transform |

## 3. GraphQL Document Processing
### 3.1. Allow overwriting of built-in fragments & queries
All fragment and query names injected / generated by this package start with an underscore (for example: `_getContentById`). During the document pre-processing, all these fragments and queries will be processed with this logic:
- If there's no query or fragment with the name without the leading underscore, it will be renamed. (i.e. `_getContentById` becomes `getContentById`)
- If a query or fragment with the name without leading underscore does exist, the built-in version with underscore will be removed from the document set.

This allows a project to overwrite built-in fragments and queries, while still ensuring type-safety.

### 3.2. Injection of fragments & queries for ContentTypes
For each content type the appropriate fragments and queries will be auto generated an injected into the document set.

### 3.3. Auto inject fragments
Dynamically build queries & fragments based upon the `injections` configuration, and the default injections from the auto-generated fragments & queries.

This allows you to tell wich group of fragments you want at a given location and then during GraphQL compilation generate the full queries based upon the current content schema in Optimizely CMS and your project configuration.

### 3.4. Remove fragments and spreads that target non-existing types
Depending on the features you have enabled in your CMS, not all types might actually be present in Optimizely Graph. This logic removes these fragments and spreads from the documents. 

This approach assumes you're using TypeScript, as missing, but required types or fields should cause an error in the TypeScript compilation step of you application. Hence it moves the error from GraphQL Codegen to TypeScript, allowing some of the changes to be handled in the code.

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
