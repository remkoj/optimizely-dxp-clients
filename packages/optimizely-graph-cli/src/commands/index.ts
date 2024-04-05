import type { CliModuleList } from 'src/app.js'

import publish from './publish.js'
import unpublish from './unpublish.js'
import list from './list.js'
import site_config from './config.js'

import * as SourceModules from './sources/index.js'

type ModuleNames = keyof typeof SourceModules
export const modules : CliModuleList = [ publish, unpublish, list, site_config ]

for (const moduleName of (Object.getOwnPropertyNames(SourceModules) as ModuleNames[])) {
    modules.push(SourceModules[moduleName])
}

export default modules