# Optimizely CMS Command Line Toolkit <!-- omit in toc -->

> [!WARNING]
> There'll be an update of Optimizely SaaS CMS that is incompatible with all SDK versions prior to 5.1.6. If you don't upgrade, you will see empty pages (main website) and "Component not found" messages (preview).

A collection of Command Line tools used to increase productivity when working with the Optimizely CMS from a TypeScript / JavaScript based frontend.

The defaults and methods are based upon using a Next.JS application with the conventions introduced by the [Create Next App template](https://github.com/remkoj/optimizely-saas-starter)

- [1. Installing](#1-installing)
- [2. General usage and parameters](#2-general-usage-and-parameters)
  - [2.1. Global parameters](#21-global-parameters)
  - [2.2. Environment variables](#22-environment-variables)
- [3. Available commands](#3-available-commands)
  - [`cms:reset`](#cmsreset)
  - [`cms:version`](#cmsversion)
  - [`nextjs:components`](#nextjscomponents)
  - [`nextjs:create`](#nextjscreate)
  - [`nextjs:factory`](#nextjsfactory)
  - [`nextjs:fragments`](#nextjsfragments)
  - [`nextjs:queries`](#nextjsqueries)
  - [`nextjs:visualbuilder`](#nextjsvisualbuilder)
  - [`style:create`](#stylecreate)
  - [`styles:delete`](#stylesdelete)
  - [`styles:list`](#styleslist)
  - [`styles:pull`](#stylespull)
  - [`styles:push`](#stylespush)
  - [`types:pull`](#typespull)
  - [`types:push`](#typespush)


## 1. Installing
This package has been designed to work in a Yarn PnP / Zero-install environment, it may or may not work with other package managers.
```bash
yarn add --dev @remkoj/optimizely-cms-cli
```

## 2. General usage and parameters

- **List all commands and global parameters:** `yarn opti-cms --help`
- **Build version:** `yarn opti-cms --version`
- **Command specific help and parameters:** `yarn opti-cms [command] --help`

### 2.1. Global parameters
All commands share these parameters that configure the frontend environment. 

| Parameter | Alias | Usage | Default |
| --- | --- | --- | --- |
| --version |  | Show version number |  |
| --path | -p | The application root folder | The current working directory |
| --components | -c | The components folder within the application | ./src/components/cms |
| --cms_url | --cu | The Url of the Optimizely CMS Service | Calculated from the environment variables `OPTIMIZELY_CMS_URL` and `OPTIMIZELY_CMS_SCHEMA`
| --client_id | --ci | The CMS Service Client ID | Taken from the environment variable `OPTIMIZELY_CMS_CLIENT_ID` |
| --client_secret | --cs | The CMS Service Client Secret | Taken from the environment variable `OPTIMIZELY_CMS_CLIENT_SECRET` |
| --user_id | u | The CMS User to impersonate | Taken from the environment variable `OPTIMIZELY_CMS_USER_ID` |
| --verbose | | Show debugging output | |
| --help | | Show help text

### 2.2. Environment variables
This CLI tool shares the environment variables with [@remkoj/optimizely-cms-api](https://www.npmjs.com/package/@remkoj/optimizely-cms-api). When starting the CLI tool, it looks for `.env` and `.env.local` to extend the environment variables and thus works using the Next.JS conventions.

## 3. Available commands
The following commands are available. You can run `opti-cms --help` or `opti-cms [command] --help` to view all options. If the command is omitted, the CLI defaults to `cms:version`.

| Command | Description | Usage |
| --- | --- | --- |
| `cms:reset` | Completely clear & reset the CMS Database | [See usage](#cmd-cms-reset) |
| `cms:version` | Get the CMS Version information | [See usage](#cmd-cms-version) |
| `nextjs:components` | Create the React Components for a Next.JS / Optimizely Graph structure | [See usage](#cmd-nextjs-components) |
| `nextjs:create` | Scaffold a complete Next.JS / Optimizely Graph structure | [See usage](#cmd-nextjs-create) |
| `nextjs:factory` | Create the ComponentFactory for a Next.JS / Optimizely Graph structure | [See usage](#cmd-nextjs-factory) |
| `nextjs:fragments` | Create the GrapQL Fragments for a Next.JS / Optimizely Graph structure | [See usage](#cmd-nextjs-fragments) |
| `nextjs:queries` | Create the GrapQL Queries to use two queries to load content | [See usage](#cmd-nextjs-queries) |
| `nextjs:visualbuilder` | Create the React Components for Visual Builder in a Next.JS / Optimizely Graph structure | [See usage](#cmd-nextjs-visualbuilder) |
| `style:create` | Create a new style definition | [See usage](#cmd-style-create) |
| `styles:delete` | Remove Visual Builder style definitions from the CMS | [See usage](#cmd-styles-delete) |
| `styles:list` | List Visual Builder style definitions from the CMS | [See usage](#cmd-styles-list) |
| `styles:pull` | Create Visual Builder style definitions from the CMS | [See usage](#cmd-styles-pull) |
| `styles:push` | Push Visual Builder style definitions into the CMS (create/patch) | [See usage](#cmd-styles-push) |
| `types:pull` | Pull content type definition files into the project | [See usage](#cmd-types-pull) |
| `types:push` | Push content type definition into Optimizely CMS (create / replace) | [See usage](#cmd-types-push) |

<a id="cmd-cms-reset"></a>
### `cms:reset`
```bash
yarn opti-cms cms:reset
```

Command-specific parameters: none. This command only uses [global parameters](#21-global-parameters).

<a id="cmd-cms-version"></a>
### `cms:version`
```bash
yarn opti-cms cms:version
```

Command-specific parameters: none. This command only uses [global parameters](#21-global-parameters).

<a id="cmd-nextjs-components"></a>
### `nextjs:components`
```bash
yarn opti-cms nextjs:components
```

| Parameter | Alias | Usage | Example |
| --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Exclude specific content type keys | `yarn opti-cms nextjs:components --excludeTypes StartPage --excludeTypes LandingPage` |
| `--excludeBaseTypes` | `--ebt` | Exclude specific base types | `yarn opti-cms nextjs:components --excludeBaseTypes media` |
| `--baseTypes` | `-b` | Include only the selected base types | `yarn opti-cms nextjs:components -b page -b section` |
| `--types` | `-t` | Include only the selected content type keys | `yarn opti-cms nextjs:components -t StartPage` |
| `--all` | `-a` | Include non-supported base types | `yarn opti-cms nextjs:components -a` |
| `--force` | `-f` | Overwrite existing generated files | `yarn opti-cms nextjs:components -f` |

<a id="cmd-nextjs-create"></a>
### `nextjs:create`
```bash
yarn opti-cms nextjs:create
```

| Parameter | Alias | Usage | Example |
| --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Exclude specific content type keys | `yarn opti-cms nextjs:create --excludeTypes StartPage` |
| `--excludeBaseTypes` | `--ebt` | Exclude specific base types | `yarn opti-cms nextjs:create --excludeBaseTypes media` |
| `--baseTypes` | `-b` | Include only the selected base types | `yarn opti-cms nextjs:create -b page -b experience` |
| `--types` | `-t` | Include only the selected content type keys | `yarn opti-cms nextjs:create -t StartPage` |
| `--all` | `-a` | Include non-supported base types | `yarn opti-cms nextjs:create -a` |
| `--force` | `-f` | Overwrite existing generated files | `yarn opti-cms nextjs:create -f` |

<a id="cmd-nextjs-factory"></a>
### `nextjs:factory`
```bash
yarn opti-cms nextjs:factory
```

| Parameter | Alias | Usage | Example |
| --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Exclude specific content type keys | `yarn opti-cms nextjs:factory --excludeTypes StartPage` |
| `--excludeBaseTypes` | `--ebt` | Exclude specific base types | `yarn opti-cms nextjs:factory --excludeBaseTypes media` |
| `--baseTypes` | `-b` | Include only the selected base types | `yarn opti-cms nextjs:factory -b page` |
| `--types` | `-t` | Include only the selected content type keys | `yarn opti-cms nextjs:factory -t StartPage` |
| `--all` | `-a` | Include non-supported base types | `yarn opti-cms nextjs:factory -a` |
| `--force` | `-f` | Overwrite existing generated files | `yarn opti-cms nextjs:factory -f` |

<a id="cmd-nextjs-fragments"></a>
### `nextjs:fragments`
```bash
yarn opti-cms nextjs:fragments
```

| Parameter | Alias | Usage | Example |
| --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Exclude specific content type keys | `yarn opti-cms nextjs:fragments --excludeTypes StartPage` |
| `--excludeBaseTypes` | `--ebt` | Exclude specific base types | `yarn opti-cms nextjs:fragments --excludeBaseTypes media` |
| `--baseTypes` | `-b` | Include only the selected base types | `yarn opti-cms nextjs:fragments -b page -b section` |
| `--types` | `-t` | Include only the selected content type keys | `yarn opti-cms nextjs:fragments -t StartPage` |
| `--all` | `-a` | Include non-supported base types | `yarn opti-cms nextjs:fragments -a` |
| `--force` | `-f` | Overwrite existing generated files | `yarn opti-cms nextjs:fragments -f` |

<a id="cmd-nextjs-queries"></a>
### `nextjs:queries`
```bash
yarn opti-cms nextjs:queries
```

| Parameter | Alias | Usage | Example |
| --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Exclude specific content type keys | `yarn opti-cms nextjs:queries --excludeTypes StartPage` |
| `--excludeBaseTypes` | `--ebt` | Exclude specific base types | `yarn opti-cms nextjs:queries --excludeBaseTypes media` |
| `--baseTypes` | `-b` | Include only selected base types (defaults to `page` and `experience`) | `yarn opti-cms nextjs:queries -b page` |
| `--types` | `-t` | Include only the selected content type keys | `yarn opti-cms nextjs:queries -t StartPage` |
| `--all` | `-a` | Include non-supported base types | `yarn opti-cms nextjs:queries -a` |
| `--force` | `-f` | Overwrite existing generated files | `yarn opti-cms nextjs:queries -f` |

<a id="cmd-nextjs-visualbuilder"></a>
### `nextjs:visualbuilder`
```bash
yarn opti-cms nextjs:visualbuilder
```

| Parameter | Alias | Usage | Example |
| --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Exclude specific content type keys | `yarn opti-cms nextjs:visualbuilder --excludeTypes StartPage` |
| `--excludeBaseTypes` | `--ebt` | Exclude specific base types | `yarn opti-cms nextjs:visualbuilder --excludeBaseTypes media` |
| `--baseTypes` | `-b` | Include only the selected base types | `yarn opti-cms nextjs:visualbuilder -b section` |
| `--types` | `-t` | Include only the selected content type keys | `yarn opti-cms nextjs:visualbuilder -t StandardPage` |
| `--all` | `-a` | Include non-supported base types | `yarn opti-cms nextjs:visualbuilder -a` |
| `--force` | `-f` | Overwrite existing generated files | `yarn opti-cms nextjs:visualbuilder -f` |

<a id="cmd-style-create"></a>
### `style:create`
```bash
yarn opti-cms style:create
```

Command-specific parameters: none. This command is interactive and prompts for all required values.

<a id="cmd-styles-delete"></a>
### `styles:delete`
```bash
yarn opti-cms styles:delete
```

| Parameter | Alias | Usage | Example |
| --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Exclude content types when resolving style targets | `yarn opti-cms styles:delete --excludeTypes StartPage` |
| `--excludeBaseTypes` | `--ebt` | Exclude base types when resolving style targets | `yarn opti-cms styles:delete --excludeBaseTypes media` |
| `--baseTypes` | `-b` | Include only styles targeting selected base types | `yarn opti-cms styles:delete -b section` |
| `--types` | `-t` | Include only styles targeting selected content types | `yarn opti-cms styles:delete -t StartPage` |
| `--all` | `-a` | Include non-supported base types | `yarn opti-cms styles:delete -a` |
| `--excludeNodeTypes` | `--ent` | Exclude specific node types | `yarn opti-cms styles:delete --excludeNodeTypes row` |
| `--excludeTemplates` | `--et` | Exclude specific style template keys | `yarn opti-cms styles:delete --excludeTemplates hero` |
| `--nodes` | `-n` | Include only selected node types | `yarn opti-cms styles:delete -n row` |
| `--templates` | `-d` | Include only selected style template keys | `yarn opti-cms styles:delete -d hero -d article` |
| `--templateTypes` | `--tt` | Include only selected style target types (`node`, `base`, `component`) | `yarn opti-cms styles:delete --tt node --tt base` |
| `--force` | `-f` | Actually perform delete; without this the command shows a dry preview | `yarn opti-cms styles:delete -f` |
| `--withStyleFile` | `-w` | Also delete local `.opti-style.json` files | `yarn opti-cms styles:delete -f -w` |
| `--definitions` | `-u` | Update/delete generated TypeScript display template helpers | `yarn opti-cms styles:delete -f -u` |

<a id="cmd-styles-list"></a>
### `styles:list`
```bash
yarn opti-cms styles:list
```

Command-specific parameters: none. This command only uses [global parameters](#21-global-parameters).

<a id="cmd-styles-pull"></a>
### `styles:pull`
```bash
yarn opti-cms styles:pull
```

| Parameter | Alias | Usage | Example |
| --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Exclude content types when resolving style targets | `yarn opti-cms styles:pull --excludeTypes StartPage` |
| `--excludeBaseTypes` | `--ebt` | Exclude base types when resolving style targets | `yarn opti-cms styles:pull --excludeBaseTypes media` |
| `--baseTypes` | `-b` | Include only styles targeting selected base types | `yarn opti-cms styles:pull -b section -b element` |
| `--types` | `-t` | Include only styles targeting selected content types | `yarn opti-cms styles:pull -t StartPage` |
| `--all` | `-a` | Include non-supported base types | `yarn opti-cms styles:pull -a` |
| `--excludeNodeTypes` | `--ent` | Exclude specific node types | `yarn opti-cms styles:pull --excludeNodeTypes row` |
| `--excludeTemplates` | `--et` | Exclude specific style template keys | `yarn opti-cms styles:pull --excludeTemplates hero` |
| `--nodes` | `-n` | Include only selected node types | `yarn opti-cms styles:pull -n row` |
| `--templates` | `-d` | Include only selected style template keys | `yarn opti-cms styles:pull -d hero -d article` |
| `--templateTypes` | `--tt` | Include only selected style target types (`node`, `base`, `component`) | `yarn opti-cms styles:pull --tt component` |
| `--force` | `-f` | Overwrite existing generated files | `yarn opti-cms styles:pull -f` |
| `--definitions` | `-u` | Create or update generated TypeScript definitions | `yarn opti-cms styles:pull -u` |

<a id="cmd-styles-push"></a>
### `styles:push`
```bash
yarn opti-cms styles:push
```

| Parameter | Alias | Usage | Example |
| --- | --- | --- | --- |
| `--excludeTemplates` | `-e` | Exclude style template keys from push | `yarn opti-cms styles:push -e hero` |
| `--templates` | `-t` | Push only selected style template keys | `yarn opti-cms styles:push -t hero -t article` |

<a id="cmd-types-pull"></a>
### `types:pull`
```bash
yarn opti-cms types:pull
```

| Parameter | Alias | Usage | Example |
| --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Exclude specific content type keys | `yarn opti-cms types:pull --excludeTypes StartPage` |
| `--excludeBaseTypes` | `--ebt` | Exclude specific base types | `yarn opti-cms types:pull --excludeBaseTypes media` |
| `--baseTypes` | `-b` | Include only selected base types | `yarn opti-cms types:pull -b page -b section` |
| `--types` | `-t` | Include only selected content type keys | `yarn opti-cms types:pull -t StartPage` |
| `--all` | `-a` | Include non-supported base types | `yarn opti-cms types:pull -a` |
| `--force` | `-f` | Overwrite existing generated files | `yarn opti-cms types:pull -f` |

<a id="cmd-types-push"></a>
### `types:push`
```bash
yarn opti-cms types:push
```

| Parameter | Alias | Usage | Example |
| --- | --- | --- | --- |
| `--force` | `-f` | Force overwrite/replace while pushing to CMS | `yarn opti-cms types:push -f` |
| `--excludeTypes` | `--ect` | Exclude specific content type keys from push | `yarn opti-cms types:push --excludeTypes StartPage` |
| `--excludeBaseTypes` | `--ebt` | Exclude content type base types from push | `yarn opti-cms types:push --excludeBaseTypes media` |
| `--baseTypes` | `-b` | Push only content types with selected base types | `yarn opti-cms types:push -b page` |
| `--types` | `-t` | Push only selected content type keys | `yarn opti-cms types:push -t StartPage -t ArticlePage` |
