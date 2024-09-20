// Node JS and 3rd Party libraries
import chalk from 'chalk'
import figures from 'figures'
import path from 'node:path'
import fs from 'node:fs'
import { input, select, confirm  } from '@inquirer/prompts';
import { OptiCmsVersion } from '@remkoj/optimizely-cms-api';

// Within this package
import type { CliModule } from '../types.js'
import { createCmsClient } from '../tools/cmsClient.js'
import { getContentTypes } from '../tools/contentTypes.js'
import { getStyles, getStyleFilePath } from '../tools/styles.js'
import parseArgs from '../tools/parseArgs.js'

export type StylesCreateParams = {
    target: string
    key: string
    description?: string | null
    default?: boolean | null
}

export const StylesCreateCommand : CliModule<StylesCreateParams> = {
    command: "style:create",
    describe: "Create a new style definition",
    builder: yargs => {
        return yargs
    },
    handler: async (args) => {
        const { components: basePath } = parseArgs(args)
        const client = createCmsClient(args)
        if (client.runtimeCmsVersion == OptiCmsVersion.CMS12) {
            process.stdout.write(chalk.gray(`${ figures.cross } Styles are not supported on CMS12\n`))
            return
        }
        const allowedBaseTypes : Array<string> = ['section','element']

        // Prepare
        process.stdout.write(chalk.yellowBright(chalk.bold(`Reading current information from Optimizely CMS\n`)))
        const [{ contentTypes },{ styles }] = await Promise.all([
            getContentTypes(client, { ...args, excludeBaseTypes: [], excludeTypes: [], baseTypes: allowedBaseTypes, types: [] }),
            getStyles(client, { ...args, excludeBaseTypes: [], excludeNodeTypes: [], excludeTemplates: [], excludeTypes: [], baseTypes: allowedBaseTypes, types: [], nodes: [], components: '', templates: [], templateTypes: []})
        ])
        const styleKeys = styles.map(x => x.key)

        // Define the configuration
        process.stdout.write(chalk.yellowBright(chalk.bold(`\nConfigure your style definition\n`)))
        const key = await input({ message: "Identifier:", validate: (val: string) => { return val.match(/^[a-zA-Z][A-Za-z0-9\-_]*$/) != null && !styleKeys.includes(val)}})
        const displayName = await input({ message: "Display name:" })
        const type = (await select({ message: "Style target:", choices: [
            { value: "baseType", name: "Base Type", description: "Target all Content-Types that inherit from the specified base type" }, 
            { value: "contentType", name: "Content-Type", description: "Target a specific Content-Type that supports styling" },
            { value: "nodeType", name: "Experience Node", description: "Target a specific node type from a Section"}
        ] })) as "baseType" | "contentType" | "nodeType"
        let typeId : string = ""
        switch (type) {
            case 'contentType':
                typeId = await select({ message: "Content-Type:", choices: contentTypes.map(x => { return { value: x.key, description: x.description, name: x.displayName }})})
                break;
            case 'nodeType':
                typeId = await select({ message: "Node type:", choices: [
                    { value: "row", description: "Row", name: "Row" },
                    { value: "column", description: "Column", name: "Column" }
                ]})
                break;
            case 'baseType':
                typeId = await select({ message: "Base type:", choices: [
                    { value: "section", description: "Target all section types", name: "Section" },
                    { value: "element", description: "Target all element types", name: "Element" }
                ]})
                break;
        }
        const isDefault = await confirm({ message: "Should this style be marked as default?" })
        //const commitToCms = await confirm({ message: "Do you want to upload this style immediately to the CMS?"})
        const definition = { key, displayName, isDefault }
        definition[type] = typeId
        definition['settings'] = {}
        const contentBaseType = type == "contentType" ? contentTypes.filter(x => x.key == typeId).map(x => x.baseType).at(0) : undefined
        const styleFilePath = await getStyleFilePath(definition, { contentBaseType, client })

        if (!fs.existsSync(path.join(basePath, path.dirname(styleFilePath))))
            fs.mkdirSync(path.join(basePath, path.dirname(styleFilePath)), { recursive: true })

        if (fs.existsSync(path.join(basePath, styleFilePath))) {
            const overwrite = await confirm({ message: "The style definition file already exists, do you want to overwrite it?" })
            if (!overwrite) {
                process.stdout.write("\n")
                process.stdout.write(chalk.redBright(chalk.bold(figures.cross+" Aborted"))+"\n")
                process.exit(0)
            }
        }

        fs.writeFileSync(path.join(basePath, styleFilePath), JSON.stringify(definition, undefined, 4))
        process.stdout.write(chalk.yellowBright(chalk.bold(`\nWritten style defintion template to: ${ path.normalize(path.join(basePath, styleFilePath ))}\n`)))
        process.stdout.write(chalk.yellowBright(`\n1. Add your properties to the 'settings' list in the file`))
        process.stdout.write(chalk.yellowBright(`\n2. Run `))
        process.stdout.write(chalk.whiteBright(`yarn opti-cms styles:push -t ${ definition.key }`))
        process.stdout.write(chalk.yellowBright(` to upload the Display Template to Optimizely CMS`))
        process.stdout.write(chalk.yellowBright(`\n3. Run `))
        process.stdout.write(chalk.whiteBright(`yarn opti-cms styles:pull -d ${ definition.key }`))
        process.stdout.write(chalk.yellowBright(` to fully create the TypeScript definitions for this Display Template\n`))
        process.stdout.write("\n")
        process.stdout.write(chalk.green(chalk.bold(figures.tick+" Done"))+"\n")
    }
}

export default StylesCreateCommand