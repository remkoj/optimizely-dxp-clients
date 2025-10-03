[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)

# Optimizely DXP SDK
This document describes the usage of the packages that form the Optimizely DXP Client, allowing you to quickly build a Next.JS (*though some packages work regardless of frontend framwork, or only depend on React*).

## Packages
This SDK consists of the following packages:
| Package | Project Type | Purpose |
| --- | --- | --- |
| [@remkoj/optimizely-cms-api](./packages/optimizely-cms-api/README.md) | Generic | Wrapper around the Optimizely SaaS CMS Rest API |
| [@remkoj/optimizely-cms-cli](./packages/optimizely-cms-cli/README.md) | Generic | A CLI Tool (`opti-cms`) providing developer productivity helpers for Optimizely SaaS CMS |
| [@remkoj/optimizely-cms-nextjs](./packages/optimizely-cms-nextjs/README.md) | Next.JS | Next.JS Specific components and scripts needed to implement a Next.JS based frontend for Optimizely SaaS CMS |
| [@remkoj/optimizely-cms-react](./packages/optimizely-cms-react/README.md) | React | React Components and scripts needed to implement a React based frontend for Optimizely SaaS CMS |
| [@remkoj/optimizely-graph-cli](./packages/optimizely-graph-cli/README.md) | Generic | A CLI Tool (`opti-graph`) providing developer productivity helpers for Optimizely Graph |
| [@remkoj/optimizely-graph-client](./packages/optimizely-graph-client/README.md) | Generic | Provides both a wrapper around the Optimizely Graph Rest API, as well as a lightweight GraphQL client based upon `graphql-request` |
| [@remkoj/optimizely-graph-functions](./packages/optimizely-graph-functions/README.md) | Generic | Provides a preset for `graphql-codegen` and some default fragments that can be used to speed up the development of a frontend that leverages Optimizely Graph |
| [@remkoj/optimizely-one-nextjs](./packages/optimizely-one-nextjs/README.md) | Next.JS | Next.JS bindings to easily integrate Optimizely products into the frontend |

> [!IMPORTANT]  
> The GraphQL Codegen preset requires a patch to enable it to work with recursive queries. Make sure to run this command after every update to ensure you're using the latest patches: `yarn opti-graph patches:apply`. Adjust when used in a mono-repo to patch the correct package.json, for example: `yarn workspace frontend opti-graph patches:apply -p ../../`

## Templates / starters
There're two templates available to get started:
- Mosey Bank Demo site: [https://github.com/episerver/cms-saas-vercel-demo](https://github.com/episerver/cms-saas-vercel-demo)
- Create Next App template: [https://github.com/remkoj/optimizely-saas-starter](https://github.com/remkoj/optimizely-saas-starter)

## Workflow
This toolset / SDK provides a hybrid workflow, supporting both code-first and CMS-first approaches to content-type & display-template management. At the heart of these workflows, there are three main capabilities:

1. The ability to push, pull & sync Content-Types between the codebase and Optimizely SaaS CMS
2. The ability to push, pull & sync Display Templates between the codebase and Optimizely SaaS CMS
3. The ability to materialize the JSON Schema definitions for both content types and display templates. *This includes a convenience tool to configure VisualStudio Code for these definitions*
4. All frontend code is validated against the actual schema in Optimizely Graph, ensuring that your application can take full advantage customizable queries.

## Common tasks
- Creating new components
- [Adjusting GraphQL Queries](../packages/optimizely-graph-functions/docs/customizing_queries.md)
