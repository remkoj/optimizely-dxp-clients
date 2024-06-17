import { CliModuleList } from '../types.js'

// Style processing
import StylesPushCommand from './styles_push.js'
import StylesListCommand from './styles_list.js'
import StylesPullCommand from './styles_pull.js'

// Type processing
import TypesPullCommand from './types_pull.js'
import TypesPushCommand from './types_push.js'

// Framework specific logic
import NextJsCreateCommand from './nextjs_create.js'

// Generic
import CmsVersionCommand from './cms_info.js'

export const commands : CliModuleList = [
    StylesPushCommand,
    StylesListCommand,
    StylesPullCommand,
    TypesPullCommand,
    TypesPushCommand,
    NextJsCreateCommand,
    CmsVersionCommand
]

export default commands