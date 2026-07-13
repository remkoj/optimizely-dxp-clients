# @remkoj/optimizely-cms-cli — usage

CLI tool for Optimizely SaaS CMS. Provides the `opti-cms` binary.

## Install

```bash
npm install --save-dev @remkoj/optimizely-cms-cli
```

Requires Node `>=24.0.0 <25.0.0`.

After each install or upgrade, a `postinstall` hook automatically runs `opti-cms project:ai` to create or refresh AI assistant configuration files in the project. The hook is silent and never blocks the install.

## Environment variables

| Variable | Description |
| --- | --- |
| `OPTIMIZELY_CMS_URL` | CMS instance URL |
| `OPTIMIZELY_CMS_CLIENT_ID` | OAuth client ID |
| `OPTIMIZELY_CMS_CLIENT_SECRET` | OAuth client secret |
| `OPTIMIZELY_DEBUG` | Set to `"1"` to enable verbose output |

## Invocation

```bash
npx opti-cms <command> [options]
# or, if installed as a devDependency:
yarn opti-cms <command> [options]
```

## Global options

| Option | Alias | Description |
| --- | --- | --- |
| `--path` | `-p` | Application root folder (default: cwd) |
| `--components` | `-c` | Path to components folder (default: `./src/components/cms`) |
| `--cms_url` | `--cu` | Optimizely CMS URL |
| `--client_id` | `--ci` | API client ID |
| `--client_secret` | `--cs` | API client secret |
| `--user_id` | `-u` | Impersonate user ID |
| `--verbose` | | Enable logging |

## Commands

| Command | Description |
| --- | --- |
| `cms:version` | Print CMS version information |
| `cms:reset` | Completely clear and reset the CMS database |
| `project:migrate` | Automate directory naming convention updates |
| `nextjs:create` | Scaffold a complete Next.js / Optimizely Graph structure |
| `nextjs:components` | Generate React components for a Next.js / Graph structure |
| `nextjs:factory` | Generate the ComponentFactory for a Next.js / Graph structure |
| `nextjs:fragments` | Generate GraphQL fragments for a Next.js / Graph structure |
| `nextjs:queries` | Generate GraphQL queries for two-query content loading |
| `nextjs:visualbuilder` | Generate Visual Builder components for a Next.js structure |
| `schema:download` | Download JSON schema files for type validation |
| `schema:list` | List all schemas available in the CMS instance |
| `schema:validate` | Validate `opti-type.json` and `opti-style.json` files |
| `schema:vscode` | Configure VS Code JSON schema validation for the project |
| `project:ai` | Create or update AI assistant config files (AGENTS.md, CLAUDE.md, GitHub Copilot, Cursor) so `@remkoj` package docs are available to the model |
| `style:create` | Create a new Visual Builder style definition |
| `styles:list` | List Visual Builder style definitions from the CMS |
| `styles:pull` | Pull Visual Builder style definitions from the CMS |
| `styles:push` | Push Visual Builder style definitions into the CMS (create/replace) |
| `styles:delete` | Remove Visual Builder style definitions from the CMS |
| `types:pull` | Pull content type definition files into the project |
| `types:push` | Push content type definitions into the CMS (create/replace) |
