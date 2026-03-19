# Optimizely CMS Command Line Toolkit <!-- omit in toc -->

> [!WARNING]
> There'll be an update of Optimizely SaaS CMS that is incompatible with all SDK versions prior to 5.1.6. If you don't upgrade, you will see empty pages (main website) and "Component not found" messages (preview).

A collection of Command Line tools used to increase productivity when working with the Optimizely CMS from a TypeScript / JavaScript based frontend.

The defaults and methods are based upon using a Next.JS application with the conventions introduced by the [Create Next App template](https://github.com/remkoj/optimizely-saas-starter)

- [1. Installing / using](#1-installing--using)
  - [1.1. Installing as development dependency](#11-installing-as-development-dependency)
  - [1.2. Usage through direct execution](#12-usage-through-direct-execution)
- [2. General usage and parameters](#2-general-usage-and-parameters)
  - [2.1. Global parameters](#21-global-parameters)
  - [2.2. Environment variables](#22-environment-variables)
- [3. Available commands](#3-available-commands)
- [4. Detailed command descriptions](#4-detailed-command-descriptions)
  - [4.1. Generate React Component Factory](#41-generate-react-component-factory)


## 1. Installing / using
This package has been tested through `npx`, `yarn dlx` as well as development dependency within a Yarn managed project. Though there *should not* be a any dependency on Yarn as package manager for your project it has not been verified.

The usage examples through this readme are assuming the package has been installed as development dependency in a Yarn managed project, you must adjust these based upon your project.

### 1.1. Installing as development dependency
This package has been designed to work in a Yarn PnP / Zero-install environment, it may or may not work with other package managers.
```bash
yarn add --dev @remkoj/optimizely-cms-cli
```

### 1.2. Usage through direct execution
Instead of using the `yarn opti-cms` as shown in the examples, which is available as short-hand after installation as development dependency, you may use one of these as well.

```bash
# Execution through NPX, latest version
npx @remkoj/optimizely-cms-cli

# Execution through Yarn DLX, latest version
yarn dlx @remkoj/optimizely-cms-cli

# Execution through NPX, explicit version 5.1.1
npx @remkoj/optimizely-cms-cli@5.1.1

# Execution through Yarn DLX, explicit version 5.1.1
yarn dlx @remkoj/optimizely-cms-cli@5.1.1
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
The following commands are currently available in `src/commands`. Use `yarn opti-cms [command] --help` for runtime help.

All commands also support the [global parameters](#21-global-parameters).

### `cms:*`
| Command | Description | Usage |
| --- | --- | --- |
| `cms:reset` | Completely clear & reset the CMS Database | `yarn opti-cms cms:reset` |
| `cms:version` | Get the CMS Version information | `yarn opti-cms cms:version` |

### `project:*`
| Command | Description | Usage |
| --- | --- | --- |
| `project:migrate` | Automate the directory naming convention update | `yarn opti-cms project:migrate` |

### `nextjs:*`
| Command | Description | Usage |
| --- | --- | --- |
| `nextjs:components` | Create the React Components for a Next.JS / Optimizely Graph structure | `yarn opti-cms nextjs:components` |
| `nextjs:create` | Scaffold a complete Next.JS / Optimizely Graph structure | `yarn opti-cms nextjs:create` |
| `nextjs:factory` | Create the ComponentFactory for a Next.JS / Optimizely Graph structure | `yarn opti-cms nextjs:factory` |
| `nextjs:fragments` | Create the GrapQL Fragments for a Next.JS / Optimizely Graph structure | `yarn opti-cms nextjs:fragments` |
| `nextjs:queries` | Create the GrapQL Queries to use two queries to load content | `yarn opti-cms nextjs:queries` |
| `nextjs:visualbuilder` | Create the React Components for Visual Builder in a Next.JS / Optimizely Graph structure | `yarn opti-cms nextjs:visualbuilder` |

### `schema:*`
| Command | Description | Usage |
| --- | --- | --- |
| `schema:download` | Create JSON schema files for selected types | `yarn opti-cms schema:download` |
| `schema:list` | List all schema's that are available within the SaaS CMS instance | `yarn opti-cms schema:list` |
| `schema:validate` | Validate the opti-type.json & opti-style.json files | `yarn opti-cms schema:validate` |
| `schema:vscode` | Configure schema validation for opti-type.json & opti-style.json files by VSCode | `yarn opti-cms schema:vscode` |

### `style*` and `styles:*`
| Command | Description | Usage |
| --- | --- | --- |
| `style:create` | Create a new style definition | `yarn opti-cms style:create` |
| `styles:delete` | Remove Visual Builder style definitions from the CMS | `yarn opti-cms styles:delete` |
| `styles:list` | List Visual Builder style definitions from the CMS | `yarn opti-cms styles:list` |
| `styles:pull` | Create Visual Builder style definitions from the CMS | `yarn opti-cms styles:pull` |
| `styles:push` | Push Visual Builder style definitions into the CMS (create/replace) | `yarn opti-cms styles:push` |

### `types:*`
| Command | Description | Usage |
| --- | --- | --- |
| `types:pull` | Pull content type definition files into the project | `yarn opti-cms types:pull` |
| `types:push` | Push content type definition into Optimizely CMS (create / replace) | `yarn opti-cms types:push` |

### `cms:reset`
Description: Completely clear & reset the CMS database.

Usage:
```bash
yarn opti-cms cms:reset
```

Parameters: no command-specific parameters (global parameters still apply).

### `cms:version`
Description: Get CMS version and service info.

Usage:
```bash
yarn opti-cms cms:version
```

Parameters: no command-specific parameters (global parameters still apply).

### `project:migrate`
Description: Rename folders/files to match the updated naming conventions and regenerate factories.

Usage:
```bash
yarn opti-cms project:migrate [options]
```

| Parameter | Alias | Optional | Default | Usage |
| --- | --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Yes | `['folder','media','image','video']` | Exclude content type keys while preparing context |
| `--excludeBaseTypes` | `--ebt` | Yes | `[]` | Exclude content base types while preparing context |
| `--baseTypes` | `-b` | Yes | `[]` | Include only selected base types |
| `--types` | `-t` | Yes | `[]` | Include only selected content types |
| `--all` | `-a` | Yes | `false` | Include unsupported base types |
| `--force` | `-f` | Yes | `false` | Overwrite generated files where applicable |

### `nextjs:components`
Description: Generate React component stubs for selected content types.

Usage:
```bash
yarn opti-cms nextjs:components [options]
```

| Parameter | Alias | Optional | Default | Usage |
| --- | --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Yes | `['folder','media','image','video']` | Exclude content type keys |
| `--excludeBaseTypes` | `--ebt` | Yes | `[]` | Exclude content base types |
| `--baseTypes` | `-b` | Yes | `[]` | Include only selected base types |
| `--types` | `-t` | Yes | `[]` | Include only selected content type keys |
| `--all` | `-a` | Yes | `false` | Include unsupported base types |
| `--force` | `-f` | Yes | `false` | Overwrite existing files |

### `nextjs:create`
Description: Run the full Next.js scaffold flow from CMS definitions.

Usage:
```bash
yarn opti-cms nextjs:create [options]
```

| Parameter | Alias | Optional | Default | Usage |
| --- | --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Yes | `['folder','media','image','video']` | Exclude content type keys |
| `--excludeBaseTypes` | `--ebt` | Yes | `[]` | Exclude content base types |
| `--baseTypes` | `-b` | Yes | `[]` | Include only selected base types |
| `--types` | `-t` | Yes | `[]` | Include only selected content type keys |
| `--all` | `-a` | Yes | `false` | Include unsupported base types |
| `--force` | `-f` | Yes | `false` | Overwrite existing generated files |

### `nextjs:factory`
Description: Generate component factory files.

Usage:
```bash
yarn opti-cms nextjs:factory [options]
```

| Parameter | Alias | Optional | Default | Usage |
| --- | --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Yes | `['folder','media','image','video']` | Exclude content type keys |
| `--excludeBaseTypes` | `--ebt` | Yes | `[]` | Exclude content base types |
| `--baseTypes` | `-b` | Yes | `[]` | Include only selected base types |
| `--types` | `-t` | Yes | `[]` | Include only selected content type keys |
| `--all` | `-a` | Yes | `false` | Include unsupported base types |
| `--force` | `-f` | Yes | `false` | Overwrite existing generated files |

### `nextjs:fragments`
Description: Generate GraphQL fragments for selected content types.

Usage:
```bash
yarn opti-cms nextjs:fragments [options]
```

| Parameter | Alias | Optional | Default | Usage |
| --- | --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Yes | `['folder','media','image','video']` | Exclude content type keys |
| `--excludeBaseTypes` | `--ebt` | Yes | `[]` | Exclude content base types |
| `--baseTypes` | `-b` | Yes | `[]` | Include only selected base types |
| `--types` | `-t` | Yes | `[]` | Include only selected content type keys |
| `--all` | `-a` | Yes | `false` | Include unsupported base types |
| `--force` | `-f` | Yes | `false` | Overwrite existing generated files |

### `nextjs:queries`
Description: Generate GraphQL queries (defaults to page/experience base types).

Usage:
```bash
yarn opti-cms nextjs:queries [options]
```

| Parameter | Alias | Optional | Default | Usage |
| --- | --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Yes | `['folder','media','image','video']` | Exclude content type keys |
| `--excludeBaseTypes` | `--ebt` | Yes | `[]` | Exclude content base types |
| `--baseTypes` | `-b` | Yes | `['page','experience']` | Include only selected base types |
| `--types` | `-t` | Yes | `[]` | Include only selected content type keys |
| `--all` | `-a` | Yes | `false` | Include unsupported base types |
| `--force` | `-f` | Yes | `false` | Overwrite existing generated files |

### `nextjs:visualbuilder`
Description: Generate Visual Builder components and node templates.

Usage:
```bash
yarn opti-cms nextjs:visualbuilder [options]
```

| Parameter | Alias | Optional | Default | Usage |
| --- | --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Yes | `['folder','media','image','video']` | Exclude content type keys |
| `--excludeBaseTypes` | `--ebt` | Yes | `[]` | Exclude content base types |
| `--baseTypes` | `-b` | Yes | `[]` | Include only selected base types |
| `--types` | `-t` | Yes | `[]` | Include only selected content type keys |
| `--all` | `-a` | Yes | `false` | Include unsupported base types |
| `--force` | `-f` | Yes | `false` | Overwrite existing generated files |

### `schema:download`
Description: Download JSON schema files from the CMS OpenAPI specification.

Usage:
```bash
yarn opti-cms schema:download [options]
```

| Parameter | Alias | Optional | Default | Usage |
| --- | --- | --- | --- | --- |
| `--schemaDir` | `-d` | Yes | `'./.schema'` | Target schema directory relative to project root |
| `--schemas` | `-s` | Yes | `['DisplayTemplate','ContentType']` | Schema names to download |
| `--force` | `-f` | Yes | `false` | Overwrite existing schema files |

### `schema:list`
Description: List schemas exposed by the CMS OpenAPI specification.

Usage:
```bash
yarn opti-cms schema:list
```

Parameters: no command-specific parameters (global parameters still apply).

### `schema:validate`
Description: Validate `*.opti-type.json` and `*.opti-style.json` files against CMS schemas.

Usage:
```bash
yarn opti-cms schema:validate
```

Parameters: no command-specific parameters (global parameters still apply).

### `schema:vscode`
Description: Configure VS Code schema mappings for Optimizely type/style JSON files.

Usage:
```bash
yarn opti-cms schema:vscode
```

Parameters: no command-specific parameters (global parameters still apply).

### `style:create`
Description: Interactive wizard to create a new style definition.

Usage:
```bash
yarn opti-cms style:create
```

Parameters: no command-specific parameters (global parameters still apply).

### `styles:delete`
Description: Delete display templates from CMS and optionally update/remove local files.

Usage:
```bash
yarn opti-cms styles:delete [options]
```

| Parameter | Alias | Optional | Default | Usage |
| --- | --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Yes | `['folder','media','image','video']` | Exclude content type keys |
| `--excludeBaseTypes` | `--ebt` | Yes | `[]` | Exclude content base types |
| `--baseTypes` | `-b` | Yes | `[]` | Include only selected base types |
| `--types` | `-t` | Yes | `[]` | Include only selected content type keys |
| `--all` | `-a` | Yes | `false` | Include unsupported base types |
| `--excludeNodeTypes` | `--ent` | Yes | `[]` | Exclude node types |
| `--excludeTemplates` | `--et` | Yes | `['folder','media','image','video']` | Exclude style template keys |
| `--nodes` | `-n` | Yes | `[]` | Include only selected node types |
| `--templates` | `-d` | Yes | `[]` | Include only selected templates |
| `--templateTypes` | `--tt` | Yes | `[]` | Include only selected template types (`node`,`base`,`component`) |
| `--force` | `-f` | Yes | `false` | Execute deletion (otherwise preview) |
| `--withStyleFile` | `-w` | Yes | `true` | Delete local `*.opti-style.json` files |
| `--definitions` | `-u` | Yes | `true` | Update/remove generated TypeScript display template definitions |

### `styles:list`
Description: List display templates from CMS.

Usage:
```bash
yarn opti-cms styles:list
```

Parameters: no command-specific parameters (global parameters still apply).

### `styles:pull`
Description: Pull display templates from CMS and generate style files/helpers.

Usage:
```bash
yarn opti-cms styles:pull [options]
```

| Parameter | Alias | Optional | Default | Usage |
| --- | --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Yes | `['folder','media','image','video']` | Exclude content type keys |
| `--excludeBaseTypes` | `--ebt` | Yes | `[]` | Exclude content base types |
| `--baseTypes` | `-b` | Yes | `[]` | Include only selected base types |
| `--types` | `-t` | Yes | `[]` | Include only selected content type keys |
| `--all` | `-a` | Yes | `false` | Include unsupported base types |
| `--excludeNodeTypes` | `--ent` | Yes | `[]` | Exclude node types |
| `--excludeTemplates` | `--et` | Yes | `['folder','media','image','video']` | Exclude style template keys |
| `--nodes` | `-n` | Yes | `[]` | Include only selected node types |
| `--templates` | `-d` | Yes | `[]` | Include only selected templates |
| `--templateTypes` | `--tt` | Yes | `[]` | Include only selected template types (`node`,`base`,`component`) |
| `--force` | `-f` | Yes | `false` | Overwrite existing files |
| `--definitions` | `-u` | Yes | `true` | Create/update generated TypeScript display template definitions |

### `styles:push`
Description: Push local style definitions into CMS.

Usage:
```bash
yarn opti-cms styles:push [options]
```

| Parameter | Alias | Optional | Default | Usage |
| --- | --- | --- | --- | --- |
| `--excludeTemplates` | `-e` | Yes | `[]` | Exclude template keys from push |
| `--templates` | `-t` | Yes | `[]` | Include only selected template keys |

### `types:pull`
Description: Pull content type definitions from CMS to local files.

Usage:
```bash
yarn opti-cms types:pull [options]
```

| Parameter | Alias | Optional | Default | Usage |
| --- | --- | --- | --- | --- |
| `--excludeTypes` | `--ect` | Yes | `['folder','media','image','video']` | Exclude content type keys |
| `--excludeBaseTypes` | `--ebt` | Yes | `[]` | Exclude content base types |
| `--baseTypes` | `-b` | Yes | `[]` | Include only selected base types |
| `--types` | `-t` | Yes | `[]` | Include only selected content type keys |
| `--all` | `-a` | Yes | `false` | Include unsupported base types |
| `--force` | `-f` | Yes | `false` | Overwrite existing files |

### `types:push`
Description: Push local content type definitions to CMS.

Usage:
```bash
yarn opti-cms types:push [options]
```

| Parameter | Alias | Optional | Default | Usage |
| --- | --- | --- | --- | --- |
| `--force` | `-f` | Yes | `false` | Overwrite/replace while pushing |
| `--excludeTypes` | `--ect` | Yes | `[]` | Exclude content type keys |
| `--excludeBaseTypes` | `--ebt` | Yes | `['folder','media','image','video']` | Exclude content base types |
| `--baseTypes` | `-b` | Yes | `[]` | Include only selected base types |
| `--types` | `-t` | Yes | `[]` | Include only selected content type keys |

## 4. Detailed command descriptions
### 4.1. Generate React Component Factory
This is a companion method to the ComponentFactory / DefaultComponentFactory implementation within [@remkoj/optimizely-cms-react](https://www.npmjs.com/package/@remkoj/optimizely-cms-react) that is used to resolve content types within Optimizely CMS into React Components. This method will create the needed files to easily construct the factory from the components in the frontend.

#### Usage & example<!-- omit in toc -->
Command: `nextjs:factory`
```Bash
yarn opti-cms nextjs:factory -f
```

#### Command line parameters<!-- omit in toc -->
| Parameter | Alias | Usage | Default |
| --- | --- | --- | --- |
| --excludeTypes | --ect | Key of content type to exclude. Can be used multiple times to exclude a list of content types | [] |
| --excludeBaseTypes | --ebt | Exclude all content types, with one of these base types. If provided it will replace the default. Add multiple times to build a list | ["folder","media","image","video"] |
| --baseTypes | -b | Select only content types with one of these base types. Add multiple times to build a list | [] |
| --types | -t | Select content types with this key. Add multiple times to build a list | [] |
| --all | -a | Include non-supported base types, non supported base types are skipped by default | |
| --force | -f | By default, this method is none-destructive. Set this parameter to overwrite existing files. | |
