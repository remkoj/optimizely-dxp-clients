import { prepare, getProjectDir } from './env.js'
import createOptiCmsApp from './app.js'
import { commands } from './commands/index.js'
import APP from './version.json' with { type: "json" }

async function main() {
    const projectDir = getProjectDir()
    const envFiles = prepare(projectDir)
    const app = createOptiCmsApp(APP.name, APP.version, undefined, envFiles, projectDir)
    app.command(commands)
    try {
        await app.parse(process.argv.slice(2))
    } catch {
        //We're ignoring error here, as yargs will already generate the "nice output" for it
        //console.log ('Caught error')
    }
}

main()
