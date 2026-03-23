import initEnvironment from './context/env.js'
import createCliApp from './app.js'
import commands from './commands/index.js'
import AppInfo from './version.json'

// Make sure the environment variables are correctly processed
initEnvironment()

// Create the application
const app = createCliApp(AppInfo.name, AppInfo.version)
app.command(commands)

// Parse the command line
app.parse(process.argv.slice(2))
