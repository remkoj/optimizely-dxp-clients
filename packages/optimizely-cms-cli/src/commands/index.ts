import { type CliModuleList } from '../types.js'

// Style processing
import StylesPushCommand from './styles_push.js'
import StylesListCommand from './styles_list.js'
import StylesPullCommand from './styles_pull.js'
import StyleCreateCommand from './style_create.js'
import StylesDeleteCommand from './styles_delete.js'

// Type processing
import TypesPullCommand from './types_pull.js'
import TypesPushCommand from './types_push.js'

// Framework specific logic
import NextJsCreateCommand from './nextjs_create.js'
import NextJsFragmentsCommand from './nextjs_fragments.js'
import NextJsQueriesCommand from './nextjs_queries.js'
import NextJsComponentsCommand from './nextjs_components.js'
import NextJsVisualBuilderCommand from './nextjs_visualbuilder.js'
import NextJsFactoryCommand from './nextjs_factories.js'

// Generic
import CmsVersionCommand from './cms_info.js'
import CmsResetCommand from './cms_reset.js'

export const commands: CliModuleList = [
  StyleCreateCommand,
  StylesDeleteCommand,
  StylesListCommand,
  StylesPullCommand,
  StylesPushCommand,
  TypesPullCommand,
  TypesPushCommand,
  NextJsComponentsCommand,
  NextJsCreateCommand,
  NextJsFactoryCommand,
  NextJsFragmentsCommand,
  NextJsQueriesCommand,
  NextJsVisualBuilderCommand,
  CmsResetCommand,
  CmsVersionCommand
]

export default commands