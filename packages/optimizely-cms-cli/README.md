# Optimizely CMS Command Line Toolkit <!-- omit in toc -->
A collection of Command Line tools used to increase productivity when working with the Optimizely CMS from a TypeScript / JavaScript based frontend.

The defaults and methods are based upon using a Next.JS application with the conventions introduced by the [Create Next App template](https://github.com/remkoj/optimizely-saas-starter)

- [1. Installing](#1-installing)
- [2. General usage and parameters](#2-general-usage-and-parameters)
  - [2.1. Global parameters](#21-global-parameters)
  - [2.2. Environment variables](#22-environment-variables)
- [3. Available commands](#3-available-commands)
  - [3.1. Generate React Component Factory](#31-generate-react-component-factory)


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
The following commands are available, you can always run `opti-cms --help` or `opti-cms [command] --help` to see all information for the CLI utility or command. If the command is omitted, the CLI will assume the `cms:version` command.

| Command | Description |
| --- | --- |
|`cms:version`| Fetch and display the version of the CMS from the endpoint, allowing validation of the connection with Optimizely CMS. |
|`cms:reset` | Reset the CMS instance by removing all Content, Content Types and Display Templates.<br/>***Note:*** This currently requires some manual steps, the CLI will provide the needed guidance on these manual steps. |
| `schema:vscode` | Updates the `.vscode` folder to include the JSON Schema for both Content Type defintions and Display Templates. This will also create or update the `settings.json` to enable code-completion and validation on `*.opti-style.json` and `*.opti-type.json` files, using these schema's. Rerun this command to ensure that the definitions remain in sync with the OpenAPI specification of the CMS API. |
| `schema:validate` | Downloads the OpenAPI Specification from the configured Optimizely CMS instance, extracts the appropriate types from it and uses those to validate all `*.opti-style.json` and `*.opti-type.json` files in the project. The output provides detailled error messages for each file that is not valid. |
| `style:create` | Create a new Style definition file *(and optionally create it immediately within the CMS as well)* using a CLI interface, that will guide you through the process of setting the required properties.<br/>***Visual Studio Code users:*** Running `yarn opti-cms schema:vscode` will enable VS-Code to provide validation and completion for the generated `*.opti-style.json` file. |
|`types:pull`| Read all existing content types from the Optimizely CMS and create their representation within the codebase. Use the parameters of this method to control which types will be pulled and to allow overwriting of existing files. |
|`types:push`| Create or overwrite the content type defintions from the codebase into Optimizely CMS, use the parameters of this method to control which types will be transferred and whether destructive changes are allowed. |
| `nextjs:factory` | Generate the component factories needed for suggested implementation pattern of Optimizely CMS in Next.JS. See [3.1. Generate React Component Factory](#31-generate-react-component-factory) |
| `nextjs:create` | An conveniance command, that will run the appropriate commands from the CLI in the right order to fully scaffold a frontend based upon the Content Types and Display Templates that already exist within the Optimizely CMS instance.<br/>It runs these commands: `types:pull`, `styles:pull`, `nextjs:fragments` `nextjs:components`, `nextjs:visualbuilder` and `nextjs:factory`. The command line arguments you provide to `nextjs:create` will be forwarded to each of these commands. |

### 3.1. Generate React Component Factory
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