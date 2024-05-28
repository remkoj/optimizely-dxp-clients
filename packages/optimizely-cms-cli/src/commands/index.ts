import { CliModuleList } from '../types.js'
import StylesPushCommand from './styles_push.js'
import StylesListCommand from './styles_list.js'
import StylesPullCommand from './styles_pull.js'
import TypesPullCommand from './types_pull.js'
import NextJsCreateCommand from './nextjs_create.js'

export const commands : CliModuleList = [
    StylesPushCommand,
    StylesListCommand,
    StylesPullCommand,
    TypesPullCommand,
    NextJsCreateCommand
]

export default commands