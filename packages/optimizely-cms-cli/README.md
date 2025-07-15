# Optimizely CMS Command Line Toolkit <!-- omit in toc -->
A collection of Command Line tools used to increase productivity when working with the Optimizely CMS from a TypeScript / JavaScript based frontend.

The defaults and methods are based upon using a Next.JS application with the conventions introduced by the [Create Next App template](https://github.com/remkoj/optimizely-saas-starter)

- [1. Installing / using](#1-installing--using)
  - [1.1. Installing as development dependency](#11-installing-as-development-dependency)
  - [1.2. Usage through direct execution](#12-usage-through-direct-execution)
- [2. General usage and parameters](#2-general-usage-and-parameters)
  - [2.1. Global parameters](#21-global-parameters)
  - [2.2. Environment variables](#22-environment-variables)
- [3. Available commands](#3-available-commands)
  - [3.1. General CMS Commands](#31-general-cms-commands)
  - [3.2. JSON Schema's and Schema Validation](#32-json-schemas-and-schema-validation)
  - [3.3. Display Templates (Styles)](#33-display-templates-styles)
  - [3.4. Content Types](#34-content-types)
  - [3.5. Next.JS Project support](#35-nextjs-project-support)
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
The following commands are available, you can always run `opti-cms --help` or `opti-cms [command] --help` to see all information for the CLI utility or command. If the command is omitted, the CLI will assume the `cms:version` command.

### 3.1. General CMS Commands
| Command | Description |
| --- | --- |
|`cms:version`| Fetch and display the version of the CMS from the endpoint, allowing validation of the connection with Optimizely CMS. |
|`cms:reset` | Reset the CMS instance by removing all Content, Content Types and Display Templates.<br/>***Note:*** This currently requires some manual steps, the CLI will provide the needed guidance on these manual steps. |

### 3.2. JSON Schema's and Schema Validation
| Command | Description |
| --- | --- |
| `schema:download` | Download schema definitions into a `.schema` folder within your project to facilitate JSON Schema validation by your IDE of choice. Use one or more `-s [schemaName]` parameters to override the schemas that must be downloaded. The `-d [relativePath]` to change where the location where the schema files must be stored. Using `-f` enables overwriting of existing schema files. |
| `schema:list` | Display a list of all schema's available within the Optimizely CMS instance.
| `schema:validate` | Downloads the OpenAPI Specification from the configured Optimizely CMS instance, extracts the appropriate types from it and uses those to validate all `*.opti-style.json` and `*.opti-type.json` files in the project. The output provides detailled error messages for each file that is not valid. |
| `schema:vscode` | Updates the `.vscode` folder to include the JSON Schema for both Content Type defintions and Display Templates. This will also create or update the `settings.json` to enable code-completion and validation on `*.opti-style.json` and `*.opti-type.json` files, using these schema's. Rerun this command to ensure that the definitions remain in sync with the OpenAPI specification of the CMS API. |

### 3.3. Display Templates (Styles)
| Command | Description |
| --- | --- |
| `style:create` | Create a new Style definition file *(and optionally create it immediately within the CMS as well)* using a CLI interface, that will guide you through the process of setting the required properties.<br/>***Visual Studio Code users:*** Running `yarn opti-cms schema:vscode` will enable VS-Code to provide validation and completion for the generated `*.opti-style.json` file. |

### 3.4. Content Types
| Command | Description |
| --- | --- |
|`types:pull`| Read all existing content types from the Optimizely CMS and create their representation within the codebase. Use the parameters of this method to control which types will be pulled and to allow overwriting of existing files. |
|`types:push`| Create or overwrite the content type defintions from the codebase into Optimizely CMS, use the parameters of this method to control which types will be transferred and whether destructive changes are allowed. |

### 3.5. Next.JS Project support
| Command | Description |
| --- | --- |
| `nextjs:factory` | Generate the component factories needed for suggested implementation pattern of Optimizely CMS in Next.JS. See [4.1. Generate React Component Factory](#41-generate-react-component-factory) |
| `nextjs:create` | An conveniance command, that will run the appropriate commands from the CLI in the right order to fully scaffold a frontend based upon the Content Types and Display Templates that already exist within the Optimizely CMS instance.<br/>It runs these commands: `types:pull`, `styles:pull`, `nextjs:fragments` `nextjs:components`, `nextjs:visualbuilder` and `nextjs:factory`. The command line arguments you provide to `nextjs:create` will be forwarded to each of these commands. |

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