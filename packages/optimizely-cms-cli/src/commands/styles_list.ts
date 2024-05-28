import type { CliModule } from '../types.js'
import { parseArgs } from '../tools/parseArgs.js'
import { createClient } from '@remkoj/optimizely-cms-api'
import chalk from 'chalk'
import figures from 'figures'
import Table from 'cli-table3'

export const StylesListCommand : CliModule = {
    command: "styles:list",
    describe: "List Visual Builder style definitions from the CMS",
    handler: async (args) => {
        const { _config: cfg, ...opts } = parseArgs(args)
        const client = createClient(cfg)
        const pageSize = 100

        process.stdout.write(chalk.yellowBright(`${ figures.arrowRight } Reading DisplayStyles from Optimizely CMS\n`))

        if (cfg.debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Fetching page 1 of ? (${ pageSize } items per page)\n`))
        let templatesPage = await client.displayTemplates.displayTemplatesList(0, pageSize)
        const results : (typeof templatesPage)["items"] = templatesPage.items ?? []
        let pagesRemaining = Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) - (templatesPage.pageIndex + 1)

        while (pagesRemaining > 0 && results.length < templatesPage.totalItemCount) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Fetching page ${ templatesPage.pageIndex + 2 } of ${ Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) } (${ templatesPage.pageSize } items per page)\n`))
            templatesPage = await client.displayTemplates.displayTemplatesList(templatesPage.pageIndex + 1, templatesPage.pageSize)
            results.push(...templatesPage.items)
            pagesRemaining = Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) - (templatesPage.pageIndex + 1)
        }

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