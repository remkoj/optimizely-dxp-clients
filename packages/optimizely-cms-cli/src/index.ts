import { prepare } from './env.js'
import createOptiCmsApp from './app.js'
import { commands } from './commands/index.js'
import APP from './version.json'

// Create the application
prepare()
const app = createOptiCmsApp(APP.version, APP.name)
app.command(commands)

// Run the application
app.parse(process.argv.slice(2))