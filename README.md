# Javascript SDKs for Optimizely Products

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)

> [!IMPORTANT]  
> The GraphQL Codegen preset requires a patch to enable it to work with recursive queries. Make sure to run this command after every update to ensure you're using the latest patches: `yarn opti-graph patches:apply`. Adjust when used in a mono-repo to patch the correct package.json, for example: `yarn workspace frontend opti-graph patches:apply -p ../../`

This repository contains the SDKs created by [Remko Jantzen](https://github.com/remkoj) and maintained in collaboration [with the community](https://github.com/remkoj/optimizely-dxp-clients/graphs/contributors) to use Optimizely products within Javascript. Though a few of these SDKs are generic, the focus is on Next.JS as framework. See the [GitHub releases page](https://github.com/remkoj/optimizely-dxp-clients/releases) for the latest updates.

If you find a bug, or have a feature request, please [report it as an issue](https://github.com/remkoj/optimizely-dxp-clients/issues) or contribute your fix/enhancement as a [Pull request](https://github.com/remkoj/optimizely-dxp-clients/pulls).

## Packages
| Package | Focus | Purpose |
| --- | --- | --- |
| [@remkoj/optimizely-cms-api](./packages/optimizely-cms-api/README.md) | Generic | Wrapper around the Optimizely SaaS CMS Rest API |
| [@remkoj/optimizely-cms-cli](./packages/optimizely-cms-cli/README.md) | Generic | A CLI Tool (`opti-cms`) providing developer productivity helpers for Optimizely SaaS CMS |
| [@remkoj/optimizely-cms-nextjs](./packages/optimizely-cms-nextjs/README.md) | Next.JS | Next.JS Specific components and scripts needed to implement a Next.JS based frontend for Optimizely SaaS CMS |
| [@remkoj/optimizely-cms-react](./packages/optimizely-cms-react/README.md) | React | React Components and scripts needed to implement a React based frontend for Optimizely SaaS CMS |
| [@remkoj/optimizely-graph-cli](./packages/optimizely-graph-cli/README.md) | Generic | A CLI Tool (`opti-graph`) providing developer productivity helpers for Optimizely Graph |
| [@remkoj/optimizely-graph-client](./packages/optimizely-graph-client/README.md) | Generic | Provides both a wrapper around the Optimizely Graph Rest API, as well as a lightweight GraphQL client based upon `graphql-request` |
| [@remkoj/optimizely-graph-functions](./packages/optimizely-graph-functions/README.md) | Generic | Provides a preset for `graphql-codegen` and some default fragments that can be used to speed up the development of a frontend that leverages Optimizely Graph |
| [@remkoj/optimizely-one-nextjs](./packages/optimizely-one-nextjs/README.md) | Next.JS | Next.JS bindings to easily integrate Optimizely products into the frontend |

## Structure
| Path | Contents |
| --- | --- |
| [artefacts](./artefacts/) | Target folder for local builds of the packages |
| [dependencies](./dependencies/) | Custom builds of 3rd party packages with Optimizely CMS/Graph specific enhancements applied. These should be installed through [resolutions or dependency overrides](https://yarnpkg.com/configuration/manifest#resolutions) in the root `package.json` of your project. |
| [packages](./packages/) | Contains the source code of each of the packages |
| [scripts](./scripts/) | Support scripts for the packaging & releasing process of these packages |

## Dependencies
These SDKs rely on - but don't include or bundle - work from others. These dependencies, including their license, are disclosed in [the dependency overview](./DEPENDENCIES.md).

## Release Notes
### v4.2.0 - latest
Release notes are provided on the [GitHub releases page](https://github.com/remkoj/optimizely-dxp-clients/releases).

### v4.1.0
- **Patches:** Dependencies have been updated to resolve vulnerabilities
- **Bug fix:** Multiple pages returned when resolving content for the homepage.
- **Bug fix:** Fragments for Blocks that contain a content area cause errors due to incorrect recursion handling. <br/>*This includes an updated version of [@graphql-codegen/visitor-plugin-common](https://www.npmjs.com/package/@graphql-codegen/visitor-plugin-common) v5.6.0 in [./dependencies/](./dependencies/)*
- **Enhancement:** JSON Files for styles (`*.opti-style.json`) and types (`*.opti-type.json`) no longer have created and modified dates to reduce merge errors.
- **Enhancement:** Handling of rich-text to auto-create missing components in the Factory to build the HTML
- **Enhancement:** Allowed more granular cache invalidation
- **Enhancement:** Improvements to Optimizely One Gadget

### v4.0.0
- Updates to support for the December 16th release of Optimizely SaaS CMS. There are no changes in the exposed APIs from these packages.

### v3.2.3
- Enhanced the error handling and parsing of `.env` files by [@remkoj/optimizely-cms-cli](./packages/optimizely-cms-cli/) and [@remkoj/optimizely-graph-cli](./packages/optimizely-graph-cli/).

### v3.2.2
- Restored some of type exports of [@remkoj/optimizely-cms-react/rsc](./packages/optimizely-cms-react/), used by the CMS 12 compatibility script.

### v3.2.1
- Fixed generation of GraphQL Fragments for Array properties with subtype "Component"
- Updated dependencies to latest versions
- Added patched version of [@graphql-codegen/visitor-plugin-common](https://www.npmjs.com/package/@graphql-codegen/visitor-plugin-common) v5.6.0 in [./dependencies/](./dependencies/)