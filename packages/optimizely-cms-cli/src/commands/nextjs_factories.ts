import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'
import { parseArgs } from '../tools/parseArgs.js'
import { type NextJsModule, builder } from './_nextjs_base.js'
import { ucFirst } from '../tools/string.js'

export const NextJsFactoryCommand : NextJsModule = {
    command: "nextjs:factory",
    describe: "Create the ComponentFactory for a Next.JS / Optimizely Graph structure",
    builder,
    handler: async (args) => {
        const { components: basePath, force, _config: { debug } } = parseArgs(args)
        if (debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Start generating component factories\n`))

        const baseDirEntries = fs.readdirSync(basePath)
        const entries = baseDirEntries
            .filter(entry => fs.statSync(path.join(basePath, entry)).isDirectory())
            .map(entry => entry == "nodes" ? processSubGroupFolder(entry, path.join(basePath, entry), force, debug) : processTypeListFolder(entry, path.join(basePath, entry), force, debug))
            .filter(x => x)

        // Post process the entries
        if (debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Post processing resolved top-level factory entries\n`))
        entries.forEach((e,i) => {
            if (isImportInfoList(e) && typeof e.prefix == 'string')
                switch (e.prefix) {
                    case "Video":
                    case "Image":
                        (entries[i] as ImportInfoList).prefix = ["Media", e.prefix, "Component"]
                        break;
                    case "Experience":
                        (entries[i] as ImportInfoList).prefix = [e.prefix,"Page"]
                        break;
                    case "Element":
                        (entries[i] as ImportInfoList).prefix = [e.prefix,"Component"]
                        break;
                }
        })

        // Add any global components
        if (debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Adding global components\n`))
        baseDirEntries.filter(x => x.endsWith('.tsx') && fs.statSync(path.join(basePath, x)).isFile()).forEach(entry => {
            const entryName = entry.substring(0,entry.length - 4).replaceAll('.','').split('-').map(p => ucFirst(p)).join('')
            const importPath = './'+entry.substring(0,entry.length - 4)
            entries.push({
                isList: false,
                component: (entryName[0].toLowerCase() + entryName.substring(1))+"Component",
                path: importPath,
                type: entryName
            })
        })

        // We're always overwriting the main factory
        if (debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Creating/overwriting main factory\n`))
        const mainFactoryFile = path.join(basePath, "index.ts")
        fs.writeFileSync(mainFactoryFile, generateFactory(entries, "cms"))
        process.stdout.write(chalk.yellow(`${ figures.arrowRight } Generated main factory in: ${ mainFactoryFile }.\n`))
    }
}

function processSubGroupFolder(groupName: string, groupTypePath: string, force: boolean = false, debug: boolean = false) : ImportInfoList
{
    const subgroupInfo : Array<ImportInfo | null> = fs
        .readdirSync(groupTypePath)
        .filter(entry => {
            return fs.statSync(path.join(groupTypePath, entry)).isDirectory()
        }).map(entry => processTypeListFolder(entry, path.join(groupTypePath, entry), force, debug))
        .filter(x => x)
    
    if (subgroupInfo.length == 0)
        return null
    const baseTypeIndex = path.join(groupTypePath, "index.ts")

    /* Check file existence and determine if we can continue */
    if (debug)
        process.stdout.write(chalk.gray(`${ figures.arrowRight } Identified base type ${ groupName }\n`))
    if (fs.existsSync(baseTypeIndex)) {
        if (!force) {
            if (debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Skipping factory for ${ groupName } - file already exists\n`))
            return {
                isList: true,
                component: groupName+'Dictionary',
                prefix: groupName[0].toUpperCase() + groupName.substring(1),
                path: './'+groupName
            }
        }
        if (debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Overwriting factory for ${ groupName }\n`))
    } else if (debug)
        process.stdout.write(chalk.gray(`${ figures.arrowRight } Generating new factory for ${ groupName }\n`))

    fs.writeFileSync(baseTypeIndex, generateFactory(subgroupInfo, groupName))
    process.stdout.write(chalk.yellow(`${ figures.arrowRight } Generated partial factory in: ${ baseTypeIndex }.\n`))

    return {
        isList: true,
        component: groupName+'Dictionary',
        prefix: groupName[0].toUpperCase() + groupName.substring(1),
        path: './'+groupName
    }
}

type ImportInfoComponent = {
    isList?: false | undefined
    type: string
    path: string
    component: string
}
type ImportInfoList = {
    isList: true
    path: string
    component: string
    prefix?: string | Array<string>
}
type ImportInfo = ImportInfoComponent | ImportInfoList

function isImportInfoList(toTest: ImportInfo) : toTest is ImportInfoList
{
    return (toTest as ImportInfoList).isList == true
}
function isPrefixedImportInfoList(toTest: ImportInfo): toTest is Required<ImportInfoList>
{
    return isImportInfoList(toTest) && ((typeof toTest.prefix == 'string' && toTest.prefix.length > 0) || (Array.isArray(toTest.prefix) && toTest.prefix.length > 0 && toTest.prefix.every(x => typeof x == 'string' && x.length > 0)))
}

function processTypeListFolder(baseType: string, baseTypePath: string, force: boolean = false, debug: boolean = false) : ImportInfo | null
{
    const baseTypeIndex = path.join(baseTypePath, "index.ts")

    /* Check file existence and determine if we can continue */
    if (debug)
        process.stdout.write(chalk.gray(`${ figures.arrowRight } Identified base type ${ baseType }\n`))
    if (fs.existsSync(baseTypeIndex)) {
        if (!force) {
            if (debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Skipping factory for ${ baseType } - file already exists\n`))
            return {
                isList: true,
                component: baseType+'Dictionary',
                prefix: baseType[0].toUpperCase() + baseType.substring(1),
                path: './'+baseType
            }
        }
        if (debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Overwriting factory for ${ baseType }\n`))
    } else if (debug)
        process.stdout.write(chalk.gray(`${ figures.arrowRight } Generating new factory for ${ baseType }\n`))
    
    // Get the components to import
    let hasStyles = false
    const components = fs
        .readdirSync(baseTypePath)
        .filter(entry => {
            if (entry == 'styles') {
                hasStyles = true
                return false
            }
            return fs.statSync(path.join(baseTypePath, entry)).isDirectory() &&
                fs.existsSync(path.join(baseTypePath, entry, "index.tsx"))
        })
        .map(entry => {
            return {
                component: entry + 'Component',
                path: './' + entry,
                type: entry
            } as ImportInfo
        })

    // Handle styles folder
    if (hasStyles) {
        const styles = processTypeListFolder("styles", path.join(baseTypePath,'styles'), force, debug)
        if (styles) {
            components.push({
                path: "./styles",
                component: "styleDictionary",
                isList: true,
                prefix: "Styles"
            })
        }
    }

    components.sort((a,b) => {
        if (isImportInfoList(a) && !isImportInfoList(b))
            return -1
        if (!isImportInfoList(a) && isImportInfoList(b))
            return 1
        return 0
    })
    if (components.length == 0) {
        if (debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } The base type ${ baseType } has no components.\n`))
        return null
    }
    if (debug)
        process.stdout.write(chalk.gray(`${ figures.arrowRight } Generating factory for ${ baseType } with the components: ${ components.map(x => x.isList == true ? x.component : x.type).join(", " )}.\n`))

    // Create the file
    const factoryContent = generateFactory(components, baseType)
    fs.writeFileSync(baseTypeIndex, factoryContent)
    process.stdout.write(chalk.yellow(`${ figures.arrowRight } Generated partial factory in: ${ baseTypeIndex }.\n`))
    
    // Build the result
    return {
        isList: true,
        component: baseType+'Dictionary',
        prefix: baseType[0].toUpperCase() + baseType.substring(1),
        path: './'+baseType
    }
}

function generateFactory(components: Array<ImportInfo>, typeName: string) : string
{
    const needsPrefixFunction = components.some(isPrefixedImportInfoList)
    const factoryContent = `// Auto generated dictionary
import { ComponentTypeDictionary } from "@remkoj/optimizely-cms-react";
${ components.map(x => `import ${ x.component } from "${ x.path }";`).join("\n") }

${ needsPrefixFunction ? `// Prefix entries - if needed
${ components.filter(isPrefixedImportInfoList).map(x => Array.isArray(x.prefix) ?
    x.prefix.map(z => `prefixDictionaryEntries(${ x.component }, "${ z }");`).join("\n") :
    `prefixDictionaryEntries(${ x.component }, "${ x.prefix }");`
).join("\n")}

` : ''}// Build dictionary
export const ${typeName}Dictionary : ComponentTypeDictionary = [
    ${ components.map(x => x.isList == true ? `...${ x.component }` : `{ 
        type: "${x.type}", 
        component: ${x.component} 
    }`).join(",\n    ")}
];

// Export dictionary
export default ${typeName}Dictionary;${ needsPrefixFunction ? `

// Helper functions
function prefixDictionaryEntries(list: ComponentTypeDictionary, prefix: string) : ComponentTypeDictionary
{
    list.forEach((component, idx, dictionary) => {
        dictionary[idx].type = typeof component.type == 'string' ? prefix + "/" + component.type : [ prefix, ...component.type ]
    });
    return list;
}` : ''}
`
    return factoryContent
}

export default NextJsFactoryCommand