# Javascript SDKs for Optimizely Products
This repository contains the SDKs created by [Remko Jantzen](https://github.com/remkoj) to use Optimizely products within Javascript. Though a few of these SDKs are generic, the focus is on Next.JS as framework.

## Packages
| Package | Purpose |
| --- | --- |
| [@remkoj/optimizely-cms-api](./packages/optimizely-cms-api/README.md) | Wrapper around the Optimizely SaaS CMS Rest API |
| [@remkoj/optimizely-cms-cli](./packages/optimizely-cms-cli/README.md) | A CLI Tool (`opti-cms`) providing developer productivity helpers for Optimizely SaaS CMS |
| [@remkoj/optimizely-cms-nextjs](./packages/optimizely-cms-nextjs/README.md) | Next.JS Specific components and scripts needed to implement a Next.JS based frontend for Optimizely SaaS CMS |
| [@remkoj/optimizely-cms-react](./packages/optimizely-cms-react/README.md) | React Components and scripts needed to implement a React based frontend for Optimizely SaaS CMS |
| [@remkoj/optimizely-graph-cli](./packages/optimizely-graph-cli/README.md) | A CLI Tool (`opti-graph`) providing developer productivity helpers for Optimizely Graph |
| [@remkoj/optimizely-graph-client](./packages/optimizely-graph-client/README.md) | Provides both a wrapper around the Optimizely Graph Rest API, as well as a lightweight GraphQL client based upon `graphql-request` |
| [@remkoj/optimizely-graph-functions](./packages/optimizely-graph-functions/README.md) | Provides a preset for `graphql-codegen` and some default fragments that can be used to speed up the development of a frontend that leverages Optimizely Graph |
| [@remkoj/optimizely-one-nextjs](./packages/optimizely-one-nextjs/README.md) | Next.JS bindings to easily integrate Optimizely products into the frontend |

## Structure
| Path | Contents |
| --- | --- |
| [artefacts](./artefacts/) | Contains the tgz bundled dev-versions of the packages |
| [packages](./packages/) | Contains the source code of each of the packages |

## Dependencies
These SDKs rely on - but don't include or bundle - work from others. These dependencies, including their license, are disclosed in [the dependency overview](./DEPENDENCIES.md).