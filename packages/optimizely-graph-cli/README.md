# Optimizely Content Graph CLI

> [!WARNING]
> This package is obsolete. Use Optimizely's official [`@optimizely/cms-sdk`](https://www.npmjs.com/package/@optimizely/cms-sdk) and [`@optimizely/cms-cli`](https://www.npmjs.com/package/@optimizely/cms-cli) packages instead.

Command line utitilities to work with Optimizely Content Graph.

[Release notes](https://github.com/remkoj/optimizely-dxp-clients/releases)

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
| webhook:create [path] [verb] |  Adds a webhook to Optimizely Graph that invokes /api/content/publish on every publish in Optimizely Graph. The publish token is sent as header `OPTIMIZELY_PUBLISH_HEADER` (default `X-OPTLY-PUBLISH`), not in the URL. Existing webhooks for the same URL (also legacy `?token=` ones) are replaced | wc, register |
| webhook:delete [path] | Removes the webhook(s) for this host and path from ContentGraph, regardless of query string or headers | wd, unregister |
| webhook:list | List all webhooks in ContentGraph (query strings and header values are masked) | wl, list |
| config:create [file_path] | ***Optimizely CMS 12 Only***: Generate a static site configuration file | cc, site-config |
| source:clear [sourceId] | Remove all data for the specified source | sc |
| source:list | List all content sources in Optimizely Graph | [default], sl |
| source:delete [sourceId] | Remove all data for the specified source | sd |
| patches:apply | Apply patches to the package.json in the working directory (use the `-p` parameter to change). Validate before running with the `-t` parameter |  |

> **Breaking change:** the publish token is no longer added to the webhook URL as `?token=`. Run `webhook:create` again after upgrading (it replaces the legacy webhook) and deploy the frontend with the same `OPTIMIZELY_PUBLISH_TOKEN` / `OPTIMIZELY_PUBLISH_HEADER`. For Vercel Deployment Protection use `OPTIMIZELY_PUBLISH_HEADER=x-vercel-protection-bypass` and `OPTIMIZELY_PUBLISH_TOKEN=${VERCEL_AUTOMATION_BYPASS_SECRET}`.

> The publish token and header are expanded once: `${VAR}` references in `OPTIMIZELY_PUBLISH_TOKEN` / `OPTIMIZELY_PUBLISH_HEADER` (also in `.env` files) are resolved by the Optimizely Graph configuration, an unset reference counts as no token (`webhook:create` exits with code 1) or throws for the header, and a literal `${...}` is written as `\${...}`.

> `webhook:delete` no longer requires `--publish_token` / `FRONTEND_PUBLISH_TOKEN`: webhooks are matched on host and path. The option is still accepted for compatibility, is deprecated and is ignored.

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
