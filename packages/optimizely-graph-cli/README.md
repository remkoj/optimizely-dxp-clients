# Optimizely Content Graph CLI
Command line utitilities to work with Optimizely Content Graph.

## Installation
Use your package manager of choice to install this package as development dependency. 

```bash
yarn add --dev @remkoj/optimizely-graph-cli
```

## Usage
This package installs the command `opti-graph` into the project, which can be used from your preferred package manager. For example from [yarn](https://yarnpkg.com/):

`yarn opti-graph <cmd> [args]`

### Commands
| Command | Description | Aliases |
| --- | --- | --- |
| webhook:create [path] [verb] |  Adds a webhook to Optimizely Graph that invokes /api/content/publish on every publish in Optimizely Graph | wc, register |
| webhook:delete [path] | Removes a webhook from ContentGraph that invokes /api/content/publish on every publish in ContentGraph | wd, unregister |
| webhook:list | List all webhooks in ContentGraph | wl, list |
| config:create [file_path] | ***Optimizely CMS 12 Only***: Generate a static site configuration file | cc, site-config |
| source:clear [sourceId] | Remove all data for the specified source | sc |
| source:list | List all content sources in Optimizely Graph | [default], sl |
| source:delete [sourceId] | Remove all data for the specified source | sd |

### Arguments
#### Frontend:
| Short | Argument | Description | Type | Default |
| --- | --- | --- | --- | --- |
| -f | --deploy_domain, --dd |  Frontend domain | string | Environment variable: `SITE_DOMAIN` |

#### Optimizely CMS Instance:
| Short | Argument | Description | Type | Default |
| --- | --- | --- | --- | --- |
| -c | --dxp_url, --du |  Optimizely CMS URL | string | Environment variable: `OPTIMIZELY_CMS_URL` |

#### Optimizely Graph Instance:
| Short | Argument | Description | Type | Default |
| --- | --- | --- | --- | --- |
| -a | --app_key, --ak | Content Graph App Key | string | Environment variable: `OPTIMIZELY_GRAPH_APP_KEY` |
| -s | --secret | Content Graph Secret | string | Environment variable: `OPTIMIZELY_GRAPH_SECRET` |
| -k | --single_key, --sk | Content Graph Single Key | string | Environment variable: `OPTIMIZELY_GRAPH_SINGLE_KEY` |
| -g | --gateway | Content Graph Gateway | string | Environment variable: `OPTIMIZELY_GRAPH_GATEWAY`, if not set or empty: https://cg.optimizely.com |

#### Debugging:
| Short | Argument | Description | Type | Default |
| --- | --- | --- | --- | --- |
| | --verbose | Enable query logging | boolean | |
| | --help | Show help | boolean | |
| | --version | Show version number | boolean | |