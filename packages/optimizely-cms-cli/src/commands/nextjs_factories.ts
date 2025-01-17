import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'
import { parseArgs } from '../tools/parseArgs.js'
import { type NextJsModule, builder } from './_nextjs_base.js'
import { ucFirst } from '../tools/string.js'
import { globSync } from 'glob'

const ROOT_FACTORY_KEY = "."
const FACTORY_FILE_NAME = "index.ts"

type ComponentFactoryDefintion = {
    file: string
    entries: Array<{
        key: string
        import: string
        variable: string
        loaderImport?: string
        loaderVariable?: string
    }>
    subfactories: Array<{
        key: string
        import: string
        prefix: string | string[]
        variable: string
        loaderImport?: never
        loaderVariable?: never
    }>
}

export const NextJsFactoryCommand : NextJsModule = {
    command: "nextjs:factory",
    describe: "Create the ComponentFactory for a Next.JS / Optimizely Graph structure",
    builder,
    handler: async (args) => {
        const { components: basePath, force, _config: { debug } } = parseArgs(args)

        if (debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Start generating component factories\n`))

        const components = globSync(["./**/*.jsx","./**/*.tsx"], {
            cwd: basePath
        }).map(p => p.split(path.sep)).filter(p => {
            // Consider components in a file starting with "_" as a partial
            if (p.at(p.length - 1)?.startsWith('_') == true)
                return false

            // Consider components in a folder named "partials" as a partial
            if (p.at(p.length - 2)?.toLowerCase() == 'partials')
                return false

            // Skip the special loader component
            if (p.at(p.length - 1) == "loading.tsx" || p.at(p.length - 1) == "loading.jsx")
                return false
            
            // Check if the file has a default export
            const fileBuffer = fs.readFileSync(path.join(basePath, p.join(path.sep)))
            const hasDefaultExport = fileBuffer.includes('export default')
            if (!hasDefaultExport) {
                process.stdout.write(chalk.redBright(`${ figures.warning } No default export in ${ p.join(path.sep ) } - ignoring file\n`))
                return false
            }
            return true
        })        

        if (debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Identified ${ components.length } components in ${ basePath }\n`))

        const componentFactoryDefintions = new Map<string, ComponentFactoryDefintion>()

        components.forEach(component => {
            const factorySegments = component.length > 2 ? component.slice(0, -2) : [ROOT_FACTORY_KEY]
            const factoryKey = factorySegments.join(path.sep)
            const factoryFile = path.join(factoryKey, FACTORY_FILE_NAME)

            // Add component to factory
            const factory : ComponentFactoryDefintion = componentFactoryDefintions.get(factoryKey) || { file: factoryFile, entries: [], subfactories: [] }
            const useSuspense = fs.existsSync(path.join(basePath, component.slice(0,-1).join(path.sep), 'loading.tsx')) || fs.existsSync(path.join(basePath, component.slice(0,-1).join(path.sep), 'loading.jsx'))
            if (useSuspense && debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Components in ${component.slice(0,-1).join(path.sep) } will use suspense\n`))

            const componentSegments = component.slice(-2).map(p => {
                const entry = p.substring(0, p.length - path.extname(p).length)
                return entry.toLowerCase() == "index" ? null : entry
            }).filter(x=>x)
            const componentImport = "./" + componentSegments.join('/')
            const loaderImport = useSuspense ? "./" + component.slice(-2).map((p,i,a) => {
                const entry = p.substring(0, p.length - path.extname(p).length)
                if (i == a.length - 1)
                    return 'loading'
                return entry.toLowerCase() == "index" ? null : entry
            }).join('/') : undefined
            factory.entries.push({
                import: componentImport,
                variable: [ ...componentSegments.map(processName), 'Component'].join(''),
                key: componentSegments.join('/') == "node" ? "Node" : componentSegments.join('/'),
                loaderImport,
                loaderVariable: useSuspense ? [ ...componentSegments.map(processName), 'Loader'].join('') : undefined,
            })
            componentFactoryDefintions.set(factoryKey, factory);

            // Register with all appropriate parents
            const parentSegements = factoryKey == ROOT_FACTORY_KEY ? factorySegments.slice(0,-1) : [ ROOT_FACTORY_KEY, ...factorySegments.slice(0,-1) ]
            let currentFactory = {
                key: factoryKey,
                import: './'+factorySegments.slice(-1).join('/'),
                prefix: processName(factorySegments.slice(-1).at(0)),
                variable: factorySegments.map(processName).join("") + "Factory"
            }
            for (let i = parentSegements.length; i > 0; i--) {
                const parentFactoryKey = parentSegements.slice(0, i).filter(x => x != ROOT_FACTORY_KEY).join(path.sep) || ROOT_FACTORY_KEY
                const parentFactory = componentFactoryDefintions.get(parentFactoryKey) ?? { file: path.join(parentFactoryKey, FACTORY_FILE_NAME), entries: [], subfactories: [] }
                if (!parentFactory.subfactories.some(x => x.key == currentFactory.key))
                    parentFactory.subfactories.push(currentFactory)
                componentFactoryDefintions.set(parentFactoryKey, parentFactory)

                if (i > 1) {
                    currentFactory = {
                        key: parentFactoryKey,
                        import: './'+parentFactoryKey.split(path.sep).slice(-1).at(0),
                        prefix: processName(parentFactoryKey.split(path.sep).slice(-1).at(0)),
                        variable: parentFactoryKey.split(path.sep).map(processName).join("") + "Factory"
                    }
                }
            }
        })

        const mainFactory = componentFactoryDefintions.get(ROOT_FACTORY_KEY)
        if (mainFactory) {
            if (debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Updating prefixes within RootFactory\n`))
            mainFactory.subfactories = mainFactory.subfactories.map(subFactory => {
                if (typeof(subFactory.prefix == 'string'))
                    switch(subFactory.prefix) {
                        case "Video":
                        case "Image":
                            subFactory.prefix = ["Media", subFactory.prefix, "Component"]
                            break;
                        case "Experience":
                            subFactory.prefix = [subFactory.prefix, "Page"]
                            break;
                        case "Element":
                            subFactory.prefix = ["Component"]
                            break;
                        case "Media":
                            subFactory.prefix = [subFactory.prefix, "Component"]
                            break;

                    }
                return subFactory
            })
        }

        if (debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Finished preparing ${ componentFactoryDefintions.size } factories, start writing\n`))

        let updateCounter = 0
        for (const key of componentFactoryDefintions.keys()) {
            const factory = componentFactoryDefintions.get(key)
            const factoryFile = path.normalize(path.join(basePath, factory.file))
            if (debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Writing factory ${ key == ROOT_FACTORY_KEY ? "cms" : key } to ${ factoryFile }\n`))

            if (shouldWriteFactory(factoryFile, force, debug)) {
                if (debug)
                    process.stdout.write(chalk.gray(`${ figures.arrowRight } Generating factory contents for: ${ factoryFile }\n`))
                const factoryFileContents = generateFactory(factory, key == ROOT_FACTORY_KEY ? "cms" : key)
                if (debug)
                    process.stdout.write(chalk.gray(`${ figures.arrowRight } Generated factory contents for: ${ factoryFile }\n`))
                fs.writeFileSync(factoryFile, factoryFileContents)
                if (debug)
                    process.stdout.write(chalk.gray(`${ figures.arrowRight } Written factory contents for: ${ factoryFile }\n`))
                updateCounter++
            }
        }

        process.stdout.write("\n")
        process.stdout.write(chalk.bold(chalk.greenBright(`${ figures.tick } Generated/updated ${ updateCounter } factories, of ${ componentFactoryDefintions.size } factories in project.`)))
        process.stdout.write("\n")
    }
}

export default NextJsFactoryCommand

function shouldWriteFactory(factoryFile: string, force: boolean = false, debug: boolean = false) : boolean
{
    if (!fs.existsSync(factoryFile)) {
        process.stdout.write(chalk.green(`${ figures.tick } Creating new factory file: ${ factoryFile }\n`))
        return true
    }
    
    if (force) {
        process.stdout.write(chalk.yellowBright(`${ figures.warning } [Force Enabled] Overwriting existing factory file: ${ factoryFile }\n`))
        return true
    }
    
    const b = fs.readFileSync(factoryFile)
    if (b.includes('@not-modified')) {
        process.stdout.write(chalk.green(`${ figures.tick } Updating existing factory file: ${ factoryFile }\n`))
        return true
    }

    if (debug)
        process.stdout.write(chalk.gray(`${ figures.arrowRight } Skipping factory as it already exists: ${ factoryFile }\n`))
    return false
}

function processName(input: string) : string {
    if (input == ROOT_FACTORY_KEY)
        return "Cms"
    const nameSegements = input.split(/[-\_]/g)
    return nameSegements.map(ucFirst).join('')
}

function generateFactory(factoryInfo: ComponentFactoryDefintion, factoryKey: string) : string
{
    const needsPrefixFunction = factoryInfo.subfactories.length > 0
    const factoryName = factoryKey.split(path.sep).map(processName).join("") + "Factory"
    const components = factoryInfo.entries
    const subFactories = factoryInfo.subfactories
    const factoryContent = `// Auto generated dictionary
// @not-modified => When this line is removed, the "force" parameter of the CLI tool is required to overwrite this file
import { type ComponentTypeDictionary } from "@remkoj/optimizely-cms-react";
${ [...components,...subFactories].map(x => {
    let importLine = `import ${ x.variable } from "${ x.import }";`
    if (x.loaderImport && x.loaderVariable) {
        importLine += `\nimport ${ x.loaderVariable } from "${ x.loaderImport }";`
    }
    return importLine
}).join("\n") }

${ needsPrefixFunction ? `// Prefix entries - if needed
${ subFactories.map(subFactory => Array.isArray(subFactory.prefix) ?
    subFactory.prefix.map(z => `prefixDictionaryEntries(${ subFactory.variable }, "${ z }");`).join("\n") :
    `prefixDictionaryEntries(${ subFactory.variable }, "${ subFactory.prefix }");`
).join("\n")}

` : ''}// Build dictionary
export const ${factoryName} : ComponentTypeDictionary = [
    ${ [...components.map(x => {
        if (x.loaderVariable) {
            return `{ 
        type: "${x.key}", 
        component: ${x.variable},
        useSuspense: true,
        loader: ${x.loaderVariable}
    }`
        } else {
            return `{ 
        type: "${x.key}", 
        component: ${x.variable} 
    }`
        }
    }), ...subFactories.map(x => 
        `...${ x.variable }`
    )].join(",\n    ")}
];

// Export dictionary
export default ${factoryName};
${ needsPrefixFunction ? `
// Helper functions
function prefixDictionaryEntries(list: ComponentTypeDictionary, prefix: string) : ComponentTypeDictionary
{
    list.forEach((component, idx, dictionary) => {
        dictionary[idx].type = typeof component.type == 'string' ? prefix + "/" + component.type : [ prefix, ...component.type ]
    });
    return list;
}
` : ''}`
    return factoryContent
}