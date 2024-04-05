import publish from './publish.js';
import unpublish from './unpublish.js';
import list from './list.js';
import site_config from './config.js';
import * as SourceModules from './sources/index.js';
export const modules = [publish, unpublish, list, site_config];
for (const moduleName of Object.getOwnPropertyNames(SourceModules)) {
    modules.push(SourceModules[moduleName]);
}
export default modules;
