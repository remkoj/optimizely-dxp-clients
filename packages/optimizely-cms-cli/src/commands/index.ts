import { type CliModuleList } from '../types.js'

// Style processing
import StylesPushCommand from './styles_push.js'
import StylesListCommand from './styles_list.js'
import StylesPullCommand from './styles_pull.js'
import StylesCreateCommand from './style_create.js'

// Type processing
import TypesPullCommand from './types_pull.js'
import TypesPushCommand from './types_push.js'

// Framework specific logic
import NextJsCreateCommand from './nextjs_create.js'
import NextJsQueriesCommand from './nextjs_fragments.js'
import NextJsComponentsCommand from './nextjs_components.js'
import NextJsVisualBuilderCommand from './nextjs_visualbuilder.js'
import NextJsFactoryCommand from './nextjs_factories.js'

// Schema commands
import SchemaVsCodeCommand from './schema_vscode.js'
import SchemaValidateCommand from './schema_validate.js'

// Generic
import CmsVersionCommand from './cms_info.js'
import CmsResetCommand from './cms_reset.js'

export const commands: CliModuleList = [
  StylesCreateCommand,
  StylesPushCommand,
  StylesListCommand,
  StylesPullCommand,
  TypesPullCommand,
  TypesPushCommand,
  NextJsCreateCommand,
  NextJsQueriesCommand,
  NextJsComponentsCommand,
  NextJsVisualBuilderCommand,
  NextJsFactoryCommand,
  CmsResetCommand,
  CmsVersionCommand,
  SchemaVsCodeCommand,
  SchemaValidateCommand
]

export default commands