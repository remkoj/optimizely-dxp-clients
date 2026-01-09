import path, { basename, dirname } from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'
import { parseArgs } from '../tools/parseArgs.js'
import { type NextJsModule, builder } from './_nextjs_base.js'
import { ucFirst } from '../tools/string.js'
import { globSync } from 'glob'

const ROOT_FACTORY_KEY = "."
const FACTORY_FILE_NAME = "index.ts"

type ComponetFactoryEntry = {
  key: string
  import: string
  variable: string
  loaderImport?: string
  loaderVariable?: string
  suspenseImport?: string
  suspenseVariable?: string
  variant?: string
}
type ComponentFactoryDefintion = {
  file: string
  entries: Array<ComponetFactoryEntry>
  subfactories: Array<ComponetFactoryEntry & { prefix?: string | string[] }>
}

export const reservedNames = ["loading.tsx", "loading.jsx","suspense.tsx", "suspense.jsx"];

export const NextJsFactoryCommand : NextJsModule = {
    command: "nextjs:factory",
    describe: "Create the ComponentFactory for a Next.JS / Optimizely Graph structure",
    builder,
    handler: async (args) => {
        const { components: basePath, force, _config: { debug } } = parseArgs(args)

        if (debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Start generating component factories\n`))

        // Get & filter all component files
        const components = globSync(["./**/*.jsx","./**/*.tsx"], {
            cwd: basePath
        }).map(p => p.split(path.sep)).filter(p => {
            // Get the filename
            const fileName = p.at(p.length - 1)
            if (!fileName) return false

            // Consider components in a file starting with "_" as a partial
            if (fileName.startsWith('_') == true)
                return false

            // Consider components in a folder named "partials" as a partial
            if (p.some(folder => folder === 'partials'))
                return false

            // Skip the special loader component
            if (reservedNames.includes(fileName))
                return false
            
            // Check if the file has a default export
            const fileBuffer = fs.readFileSync(path.join(basePath, p.join(path.sep)))
            const hasDefaultExport = fileBuffer.includes('export default')
            if (!hasDefaultExport) {
                process.stdout.write(chalk.redBright(`${ figures.warning } No default export in ${ p.join(path.sep ) } - ignoring file\n`))
                return false
            }
            return true
        });

        // Report what we have found
        if (debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Identified ${ components.length } components in ${ basePath }\n`))

        // Build factory / component structure
        const componentFactoryDefintions = new Map<string, ComponentFactoryDefintion>()
        components.forEach(component => {
            // Determine component target
            const componentKey = processName(component.length == 1 ? ucFirst(path.basename(component[0], path.extname(component[0]))) : component.at(component.length - 2));
            let componentVariant = (component.length > 1 ? component.at(component.length - 1) ?? 'default' : 'default').replace('index','default');
            componentVariant = path.basename(componentVariant, path.extname(componentVariant));
            const componentDir = path.dirname(path.join(...component));

            // Get factory information
            const factorySegments = component.length > 2 ? component.slice(0, -2) : [ROOT_FACTORY_KEY];
            const factoryKey = path.posix.join(...factorySegments);
            const factoryFile = path.join(factoryKey, FACTORY_FILE_NAME);

            // Check dynamic & suspense
            const useDynamic = [
              path.join(basePath, componentDir , 'loading.tsx'),
              path.join(basePath, componentDir , 'loading.jsx')
            ].some(fs.existsSync);
            const useSuspense = [
              path.join(basePath, componentDir , 'suspense.tsx'),
              path.join(basePath, componentDir , 'suspense.jsx')
            ].some(fs.existsSync);

            // Prepare data
            const componentImport = component.length == 1 ? 
              `.${path.posix.sep}${path.basename(component[0], path.extname(component[0]))}` :
              `.${path.posix.sep}${path.posix.relative(factoryKey, componentDir)}${ componentVariant !== 'default' ? path.posix.sep + componentVariant : ''}`;
            const loaderImport = useDynamic ? componentImport + path.posix.sep + 'loading' : undefined;
            const suspenseImport = useSuspense ? componentImport + path.posix.sep + 'suspense' : undefined;
            
            const componentVariablesBase = componentKey + ( componentVariant !== 'default' ? processName(componentVariant) :  '')

            // Add to the factory
            const factory : ComponentFactoryDefintion = componentFactoryDefintions.get(factoryKey) || { file: factoryFile, entries: [], subfactories: [] }
            factory.entries.push({
              key: componentKey,
              variant: componentVariant,
              import: componentImport,
              variable: componentVariablesBase + 'Component',
              loaderImport,
              loaderVariable: useDynamic ? componentVariablesBase + 'Loader' : undefined,
              suspenseImport,
              suspenseVariable: useSuspense ? componentVariablesBase + 'Placeholder' : undefined
            });
            componentFactoryDefintions.set(factoryKey, factory);

            // Add/update parent factories
            const parentSegements = factoryKey == ROOT_FACTORY_KEY ? factorySegments.slice(0,-1) : [ ROOT_FACTORY_KEY, ...factorySegments.slice(0,-1) ]
            parentSegements.forEach((_, idx, data) => {
              const parentFactoryKey = path.posix.join(...data.slice(0, idx+1)) || ROOT_FACTORY_KEY;
              const childFactoryKey = factorySegments.slice(idx,idx+1).at(0);
              const parentFactory = componentFactoryDefintions.get(parentFactoryKey) ?? { file: path.join(parentFactoryKey, FACTORY_FILE_NAME), entries: [], subfactories: [] }
              if (!parentFactory.subfactories.some(x => x.key === childFactoryKey)) {
                parentFactory.subfactories.push({
                  key: childFactoryKey,
                  import: './'+childFactoryKey,
                  variable: processName(childFactoryKey) + 'Factory'
                })
                componentFactoryDefintions.set(parentFactoryKey, parentFactory)
              }
            })
        })

        // Report factory file count
        if (debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Finished preparing ${ componentFactoryDefintions.size } factories, start writing\n`))

        // Iterate over the factories and create them
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
  // Get the factory name
  const factoryName = factoryKey.split(path.sep).map(processName).join("") + "Factory"

  // Get the components and sub-factories, sorted by key to minimize changes between runs
  const components = [...factoryInfo.entries].sort((a,b) => { return a.key < b.key ? -1 : a.key > b.key ? 1 : 0 })
  const subFactories = [...factoryInfo.subfactories].sort((a,b) => { return a.key < b.key ? -1 : a.key > b.key ? 1 : 0 })

  // Check if there's at least one component that uses next/dynamic
  const hasDynamic = factoryInfo.entries.some(x => x.loaderImport)

  // The intro for the factory
  const factoryIntro = `// Auto generated dictionary
// @not-modified => When this line is removed, the "force" parameter of the CLI tool is required to overwrite this file
import { type ComponentTypeDictionary } from '@remkoj/optimizely-cms-react';${ hasDynamic ? `
import dynamic from 'next/dynamic';` : ''}`

  // The outry for the factory
  const factoryOutro = `// Export dictionary
export default ${factoryName};`

  // The imports of the factory
  const factoryImports = [...components, ...subFactories].map(x => {
    let imports = [x.loaderImport ? 
      `import ${ x.loaderVariable } from '${ x.loaderImport }';` :
      `import ${ x.variable } from '${ x.import }';`];
    if (x.suspenseImport)
      imports.push(`import ${ x.suspenseVariable } from '${ x.suspenseImport }';`)
    return imports.join('\n');
  }).join('\n');

  // The dynamic imports of the factory
  const dynamicImports = hasDynamic ? `// Lazy load components that have a loading file, this only affects client components
// See https://nextjs.org/docs/app/guides/lazy-loading#importing-server-components
// for more details on how this affects server components in Next.js
`+components.filter(x => x.loaderImport).map(x=>{
    return `const ${ x.variable } = dynamic(() => import('${ x.import }'), {
  ssr: true,
  loading: ${ x.loaderVariable }
});`
  }).join('\n') : undefined;

  // The actual entries for the factory
  const factoryEntries = [...components.map(x => {
    return `  {
    type: '${ x.key }',${ x.variant && x.variant !== 'default' ? `
    variant: '${ x.variant }',`: ''}
    component: ${ x.variable }${ x.suspenseVariable ? `,
    useSuspense: true,
    loader: ${ x.suspenseVariable }` : '' }
  }`
  }), ...subFactories.map(x => `  ...${ x.variable }`)];

  // The body of the factory
  const factoryBody = `// Build dictionary
export const ${factoryName} : ComponentTypeDictionary = [${ factoryEntries.length > 0 ? '\n' + factoryEntries.join(',\n')+'\n' : '' }];`

  // Combine everything into one string
  return [ factoryIntro, factoryImports, dynamicImports, factoryBody, factoryOutro ].filter(x => (x?.length || 0) > 0).join('\n\n')+'\n';
}
