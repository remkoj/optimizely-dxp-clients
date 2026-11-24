# @remkoj/optimizely-graph-cli — usage

> [!WARNING]
> This package is obsolete. Use Optimizely's official [`@optimizely/cms-sdk`](https://www.npmjs.com/package/@optimizely/cms-sdk) and [`@optimizely/cms-cli`](https://www.npmjs.com/package/@optimizely/cms-cli) packages instead.

CLI tool for Optimizely Graph (Content Graph). Provides the `opti-graph` binary.

## Install

```bash
npm install --save-dev @remkoj/optimizely-graph-cli
```

Requires Node `>=24.0.0 <25.0.0`.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `OPTIMIZELY_GRAPH_APP_KEY` | yes | Content Graph application key |
| `OPTIMIZELY_GRAPH_SECRET` | yes | Content Graph secret |
| `OPTIMIZELY_GRAPH_SINGLE_KEY` | yes | Content Graph single key (read-only) |
| `OPTIMIZELY_GRAPH_GATEWAY` | no | Gateway URL (default: `https://cg.optimizely.com`) |
| `OPTIMIZELY_PUBLISH_TOKEN` | for `webhook:create` | Publish webhook secret (or `--publish_token`; `webhook:delete` no longer needs a token: `--publish_token`/`FRONTEND_PUBLISH_TOKEN` are optional, deprecated and ignored there, as it matches on host and path). `${VAR}` references are expanded once (by the configuration, not by the `.env` loader), e.g. `${VERCEL_AUTOMATION_BYPASS_SECRET}`; an unset reference counts as no token (exit code 1); escape a literal as `\${...}` |
| `OPTIMIZELY_PUBLISH_HEADER` | no | Header that carries the token (default `X-OPTLY-PUBLISH`) |
| `OPTIMIZELY_CMS_URL` | no | CMS instance URL |
| `OPTIMIZELY_DEBUG` | no | Set to `"1"` for verbose output |

## Invocation

```bash
npx opti-graph <command> [options]
# or, if installed as a devDependency:
yarn opti-graph <command> [options]
```

## Global options

| Option | Alias | Description |
| --- | --- | --- |
| `--app_key` | `-a`, `--ak` | Content Graph app key |
| `--secret` | `-s` | Content Graph secret |
| `--single_key` | `-k`, `--sk` | Content Graph single key |
| `--gateway` | `-g` | Content Graph gateway URL |
| `--dxp_url` | `--du`, `-c` | Optimizely CMS URL |
| `--deploy_domain` | `--dd`, `-f` | Frontend domain |
| `--verbose` | | Enable query logging |

## Commands

| Command | Aliases | Description |
| --- | --- | --- |
| `source:list` | `sl` | List all content sources in Optimizely Graph |
| `source:clear [sourceId]` | `sc` | Remove all data for the specified source |
| `source:delete [sourceId]` | `sd` | Delete the specified source entirely |
| `config:create [file_path]` | `cc`, `site-config` | Generate a static site configuration file |
| `webhook:create [path] [verb]` | `wc`, `register` | Register a publish webhook on Optimizely Graph. The publish token is registered as header `OPTIMIZELY_PUBLISH_HEADER` (default `X-OPTLY-PUBLISH`), the URL contains no token. Existing webhooks for the same host and path (including legacy `?token=` ones) are replaced; the token is never printed |
| `webhook:delete [path]` | `wd`, `unregister` | Remove the publish webhook(s) for the host and path from Optimizely Graph, regardless of query string or headers (or one webhook with `--token_id`) |
| `webhook:list` | `wl`, `list` | List the webhooks; query strings and header values are not shown |
| `patches:apply` | | Re-apply the patched `@graphql-codegen/visitor-plugin-common` dependency |
