import type { CliModule } from '../types.js'
import { parseArgs } from '../tools/parseArgs.js'
import { createClient } from '@remkoj/optimizely-cms-api'
import { glob } from 'glob'
import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'
import Table from 'cli-table3'

export const StylesPushCommand : CliModule = {
    command: "styles:push",
    describe: "Push Visual Builder style definitions into the CMS (create/replace)",
    handler: async (args) => {
        const { _config: cfg, ...opts } = parseArgs(args)
        const client = createClient(cfg)

        /*const currentTemplates = await client.displayTemplates.displayTemplatesList()
        currentTemplates.items?.map(tpl => {
            console.log(JSON.stringify(tpl, undefined, 4))
        })*/
        
        process.stdout.write(chalk.yellowBright(`${ figures.arrowRight } Pushing (create/replace) DisplayStyles into Optimizely CMS\n`))

        const styleDefinitionFiles = await glob("./**/*.opti-style.json", {
            cwd: opts.components
        })
        const results = await Promise.all(styleDefinitionFiles.map(async styleDefinitionFile => {
            const filePath = path.normalize(path.join(opts.components, styleDefinitionFile))
            const styleDefinition = tryReadJsonFile(filePath, cfg.debug)
            const styleKey = styleDefinition.key
            if (!styleKey) {
                process.stderr.write(chalk.redBright(`${ chalk.bold(figures.cross) } The style definition in ${ path.relative(opts.path, filePath) } does not have a key defined\n`))
                return
            }
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Pushing: ${ styleKey }\n`))

            const newTemplate = await client.displayTemplates.displayTemplatesPut(styleKey, styleDefinition)
            return newTemplate
        }))

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
export default StylesPushCommand

function tryReadJsonFile<T = any>(filePath: string, debug: boolean = false): T | undefined
{
    try {
        if (debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Reading style definition from ${ filePath }\n`))
        return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf-8'}))
    } catch(e) {
        process.stderr.write(chalk.redBright(`${ chalk.bold(figures.cross) } Error while reading ${ filePath }\n`))
    }
    return undefined
}