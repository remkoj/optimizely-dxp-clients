import { prepare } from './env.js'
import createOptiCmsApp from './app.js'
import { commands } from './commands/index.js'
import APP from './version.json' with { type: "json" }

// Create the application
prepare()
const app = createOptiCmsApp(APP.name, APP.version)
app.command(commands)

// Run the application
app.parse(process.argv.slice(2))