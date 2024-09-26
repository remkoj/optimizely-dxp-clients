import type { CliModule } from '../types.js'
import chalk from 'chalk'
import figures from 'figures'
import Table from 'cli-table3'

import { OptiCmsVersion } from '@remkoj/optimizely-cms-api'
import { createCmsClient } from '../tools/cmsClient.js'
import { getStyles } from '../tools/styles.js'

export const StylesListCommand : CliModule = {
    command: "styles:list",
    describe: "List Visual Builder style definitions from the CMS",
    handler: async (args) => {
        const client = createCmsClient(args)
        if (client.runtimeCmsVersion == OptiCmsVersion.CMS12) {
            process.stdout.write(chalk.gray(`${ figures.cross } Styles are not supported on CMS12\n`))
            return
        }
        const { all: results } = await getStyles(client, { ...args, excludeBaseTypes: [], excludeNodeTypes: [], excludeTemplates: [], excludeTypes: [], baseTypes: [], nodes: [], templates: [], types: [], templateTypes: [], all: false})
        const styles = new Table({
            head: [
                chalk.yellow(chalk.bold("Name")),
                chalk.yellow(chalk.bold("Key")),
                chalk.yellow(chalk.bold("Default")),
                chalk.yellow(chalk.bold("Target"))
            ],
            colWidths: [ 31, 20, 9, 20 ],
            colAligns: [ "left", "left", "center", "left" ]
        })
        results.forEach(tpl => {
            styles.push([ 
                tpl.displayName, 
                tpl.key, 
                tpl.isDefault ? figures.tick : figures.cross, 
                tpl.contentType ? `${ tpl.contentType } (C)` : tpl.baseType ? `${tpl.baseType } (B)` : `${ tpl.nodeType } (N)` 
            ])
        })
        process.stdout.write(styles.toString()+"\n")
        process.stdout.write(chalk.green(chalk.bold(figures.tick+" Done"))+"\n")
    }
}
export default StylesListCommand