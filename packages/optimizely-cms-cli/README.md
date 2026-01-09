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
  - [3.1. Generate React Component Factory](#31-generate-react-component-factory)
  - [3.2. Check build and CMS Versions](#32-check-build-and-cms-versions)


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
|`cms:version`| Fetch the version of the CMS from the endpoint. See [3.2. Check build and CMS Versions](#32-check-build-and-cms-versions) |
|`cms:reset` | Reset the CMS instance by removing all Content, Content Types and Display Templates.<br/>***Note:*** This currently requires some manual steps, the CLI will provide the needed guidance on these manual steps. |
|`types:pull`| Read all existing content types from the Optimizely CMS and create their representation within the codebase. Use the parameters of this method to control which types will be pulled and to allow overwriting of existing files. |
|`types:push`| Create or overwrite the content type defintions from the codebase into Optimizely CMS, use the parameters of this method to control which types will be transferred and whether destructive changes are allowed. |
| `nextjs:factory` | Generate the component factories needed for suggested implementation pattern of Optimizely CMS in Next.JS. See [3.1. Generate React Component Factory](#31-generate-react-component-factory) |

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

### 3.2. Check build and CMS Versions
Connect to the Optimizely CMS Service to fetch service health and version information.

#### Usage & example<!-- omit in toc -->
Command: `cms:version`
```Bash
yarn opti-cms cms:version
```
