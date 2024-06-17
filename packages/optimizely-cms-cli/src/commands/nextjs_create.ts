import type { CliModule } from '../types.js'
import { parseArgs } from '../tools/parseArgs.js'
import { createClient, type CmsIntegrationApiOptions, type IntegrationApi } from '@remkoj/optimizely-cms-api'
import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'

type TypesPullModule = CliModule<{ 
    force: boolean, 
    excludeBaseTypes: string[], 
    excludeTypes: string[] 
}>

export const NextJsCreateCommand : TypesPullModule = {
    command: "nextjs:create",
    describe: "Scaffold a complete Next.JS / Optimizely Graph structure",
    builder: (yargs) => {
        yargs.option('force', { alias: 'f', description: "Overwrite existing files", boolean: true, type: 'boolean', demandOption: false, default: false })
        yargs.option('excludeTypes', { alias: 'ect', description: "Exclude these content types", string: true, type: 'array', demandOption: false, default: []})
        yargs.option('excludeBaseTypes', { alias: 'ebt', description: "Exclude these base types", string: true, type: 'array', demandOption: false, default: ['folder','media','image','video']})
        return yargs
    },
    handler: async (args) => {
        const { _config: cfg, components: basePath, excludeBaseTypes, excludeTypes, force } = parseArgs(args)
        const client = createClient(cfg)
        const pageSize = 100

        process.stdout.write(chalk.yellowBright(`${ figures.arrowRight } Pulling Content Types from Optimizely CMS\n`))

        if (cfg.debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Fetching page 1 of ? (${ pageSize } items per page)\n`))
        let templatesPage = await client.contentTypes.contentTypesList(undefined, undefined, 0, pageSize)
        const results : (typeof templatesPage)["items"] = templatesPage.items ?? []
        let pagesRemaining = Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) - (templatesPage.pageIndex + 1)

        while (pagesRemaining > 0 && results.length < templatesPage.totalItemCount) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Fetching page ${ templatesPage.pageIndex + 2 } of ${ Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) } (${ templatesPage.pageSize } items per page)\n`))
            templatesPage = await client.contentTypes.contentTypesList(undefined, undefined, templatesPage.pageIndex + 1, templatesPage.pageSize)
            results.push(...templatesPage.items)
            pagesRemaining = Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) - (templatesPage.pageIndex + 1)
        }

        if (cfg.debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Fetched ${ results.length } Content-Types from Optimizely CMS\n`))

        if (!fs.existsSync(basePath))
            fs.mkdirSync(basePath, { recursive: true })

        if (!fs.statSync(basePath).isDirectory()) {
            process.stderr.write(chalk.redBright(`${ chalk.bold(figures.cross) } The components path ${ basePath } is not a folder\n`))
            process.exit(1)
        }

        // Apply content type filters
        if (cfg.debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Applying content type filters\n`))
        const contentTypes = results.filter(contentType => {
            if (contentType.source == 'system') {
                if (cfg.debug)
                    process.stdout.write(chalk.gray(`${ figures.arrowRight } Skipping ${ contentType.displayName } (${ contentType.key }) - Internal CMS type\n`))
                return false
            }
            const baseType = contentType.baseType ?? 'default'
            if (excludeBaseTypes.includes(baseType)) {
                if (cfg.debug)
                    process.stdout.write(chalk.gray(`${ figures.arrowRight } Skipping ${ contentType.displayName } (${ contentType.key }) - Base type excluded\n`))
                return false
            }
            if (excludeTypes.includes(contentType.key)) {
                if (cfg.debug)
                    process.stdout.write(chalk.gray(`${ figures.arrowRight } Skipping ${ contentType.displayName } (${ contentType.key }) - Content type excluded\n`))
                return false
            }
            return true
        })
        if (cfg.debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Applied content type filters, reduced from ${ results.length } to ${ contentTypes.length } items\n`))

        // Create the type specific
        const updatedTypes = contentTypes.map(contentType => {

            const baseType = contentType.baseType ?? 'default'

            // Create the type folder
            const typePath = path.join(basePath, baseType, contentType.key)
            if (!fs.existsSync(typePath))
                fs.mkdirSync(typePath, { recursive: true })

            // Create fragments
            createGraphFragments(contentType, typePath, basePath, force, cfg, contentTypes)
            // Create component
            createComponent(contentType, typePath, force, cfg)

            return contentType.key
        }).filter(x => x)

        createFactory(contentTypes, basePath, force, cfg)

        process.stdout.write(chalk.yellowBright(`${ figures.arrowRight } Created/updated type definitions for ${ updatedTypes.join(', ') }\n`))
        process.stdout.write(chalk.green(chalk.bold(figures.tick+" Done"))+"\n")
    }
}

export default NextJsCreateCommand

function createFactory(contentTypes: IntegrationApi.ContentType[], basePath: string, force: boolean, cfg: CmsIntegrationApiOptions)
{
    // Get the list of all base types
    const baseTypes = contentTypes.map(x => x.baseType as string).concat(['default']).filter((x, i, a) => x && !a.slice(0,i).includes(x)).sort()
    const baseTypeFactories = baseTypes.map(baseType => {
        // Get the list of inheriting types and return if it's empty
        const inheritingTypes = contentTypes.filter(x => x.baseType == baseType)
        if (inheritingTypes.length == 0)
            return

        if (cfg.debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Factory for ${ ucFirst(baseType) } will contain these components: ${ inheritingTypes.map(x => x.displayName ?? x.key).join(", ")}\n`))

        // Check the file presence and if we should overwrite
        const baseTypeFactory = path.join(basePath, baseType, 'index.ts')
        if (fs.existsSync(baseTypeFactory)) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Overwriting ${ ucFirst(baseType) } factory\n`))
        }

        // Build the actual factory
        const lines = [
            '// Auto generated dictionary',
            'import { ComponentTypeDictionary } from "@remkoj/optimizely-cms-react";'
        ]
        inheritingTypes.forEach(type => {
            lines.push(`import ${ type.key } from "./${ type.key }";`)
        })
        lines.push('')
        lines.push(`export const ${ baseType }Dictionary : ComponentTypeDictionary = [`)
        inheritingTypes.forEach(type => {
            lines.push('    {',`        type: '${ type.key }',`,`        component: ${ type.key }`,'    },')
        })
        lines.push(']','',`export default ${ baseType }Dictionary`)
        fs.writeFileSync(baseTypeFactory, lines.join("\n"))
        return baseType
    }).filter(x => x)

    const cmsFactoryFile = path.join(basePath, 'index.ts')
    if (fs.existsSync(cmsFactoryFile)) {
        if (cfg.debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Overwriting CMS Components factory\n`))
    }
    const lines = [
        '// Auto generated dictionary',
        'import { ComponentTypeDictionary } from "@remkoj/optimizely-cms-react";'
    ]
    baseTypeFactories.forEach(type => {
        lines.push(`import ${ type }Components from "./${ type }";`)
    })
    lines.push('')
    baseTypeFactories.forEach(type => {
        lines.push(`prefixDictionaryEntries(${ type }Components, '${ ucFirst(type) }');`)
        if (type == "experience")
            lines.push(`prefixDictionaryEntries(${ type }Components, 'Page'); // Experiences are a subtype of Page`)
        if (type == "element")
            lines.push(`prefixDictionaryEntries(${ type }Components, 'Component'); // Elements are a subtype of Component`)
    })
    lines.push('')
    lines.push('export const cmsComponentDictionary : ComponentTypeDictionary = [')
    baseTypeFactories.forEach(type => {
        lines.push(`    ...${ type }Components,`)
    })
    lines.push(']','',`export default cmsComponentDictionary`,`function prefixDictionaryEntries(list: ComponentTypeDictionary, prefix: string) : ComponentTypeDictionary
{
    list.forEach((component, idx, dictionary) => {
        dictionary[idx].type = typeof component.type == 'string' ? prefix + "/" + component.type : [ prefix, ...component.type ]
    })
    return list
}`)
    fs.writeFileSync(cmsFactoryFile, lines.join("\n"))
}

function createComponent(contentType : IntegrationApi.ContentType, typePath: string, force: boolean, cfg: CmsIntegrationApiOptions)
{
    const componentFile = path.join(typePath, 'index.tsx')
    if (fs.existsSync(componentFile)) {
        if (force) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Overwriting ${ contentType.displayName } (${ contentType.key }) component\n`))
        } else {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Skipping ${ contentType.displayName } (${ contentType.key }) component - file already exists\n`))
            return undefined
        }
    }
    const isPage = contentType.baseType == 'page' || (contentType.baseType as string) == 'experience'
    const varName = `${ contentType.key }${ ucFirst(contentType.baseType ?? 'part' ) }`
    const component = `import ${ isPage ? '{ OptimizelyNextPage as CmsComponent } from "@remkoj/optimizely-cms-nextjs"' : '{ CmsComponent } from "@remkoj/optimizely-cms-react"'};
import { ${ contentType.key }DataFragmentDoc, type ${ contentType.key }DataFragment } from "@/gql/graphql";

/**
 * ${ contentType.displayName }
 * ${ contentType.description }
 */
export const ${ varName } : CmsComponent<${ contentType.key }DataFragment> = ({ data }) => {
    const componentName = '${ contentType.displayName }'
    const componentInfo = '${ contentType.description ?? '' }'
    return <div className="mx-auto px-2 container">
        <div>{ componentName }</div>
        <div>{ componentInfo }</div>
        <pre className="w-full overflow-x-hidden font-mono text-sm">{ JSON.stringify(data, undefined, 4) }</pre>
    </div>
}
${ varName }.displayName = "${ contentType.displayName } (${ ucFirst(contentType.baseType)}/${ contentType.key })"
${ varName }.getDataFragment = () => ['${ contentType.key }Data', ${ contentType.key }DataFragmentDoc]
${ isPage && `${ varName }.getMetaData = async (contentLink) => {
    // Add your metadata logic here
    return {}
}`.trim()}

export default ${ varName }`
    fs.writeFileSync(componentFile, component)
}

function ucFirst(current: string) {
    return current[0]?.toUpperCase() + current.substring(1)
}

function createGraphFragments(contentType : IntegrationApi.ContentType, typePath: string, basePath: string, force: boolean, cfg: CmsIntegrationApiOptions, contentTypes : IntegrationApi.ContentType[])
{
    const baseType = contentType.baseType ?? 'default'
    const baseQueryFile = path.join(typePath, `${ contentType.key }.${ baseType }.graphql`)
    if (fs.existsSync(baseQueryFile)) {
        if (force) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Overwriting ${ contentType.displayName } (${ contentType.key }) base fragment\n`))
        } else {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Skipping ${ contentType.displayName } (${ contentType.key }) base fragment - file already exists\n`))
            return undefined
        }
    }

    const { fragment, propertyTypes } = createInitialFragment(contentType)
    fs.writeFileSync(baseQueryFile, fragment)

    let dependencies = Array.isArray(propertyTypes) ? [ ...propertyTypes ] : []
    while (Array.isArray(dependencies) && dependencies.length > 0) {
        let newDependencies : [string, boolean][] = []
        dependencies.forEach(dep => {
            const propContentType = contentTypes.filter(x => x.key == dep[0])[0]
            if (!propContentType) {
                console.warn(`🟠 The content type ${ dep[0] } has been referenced, but is not found in the Optimizely CMS instance`)
                return
            }
            const propertyFragmentFile = path.join(basePath,propContentType.baseType ?? 'default',propContentType.key,`${ propContentType.key }.property.graphql`)
            const propertyFragmentDir = path.dirname(propertyFragmentFile)

            if (!fs.existsSync(propertyFragmentDir))
                fs.mkdirSync(propertyFragmentDir, { recursive: true });

            if (!fs.existsSync(propertyFragmentFile) || force) {
                process.stdout.write(` - Writing property fragment: ${ propContentType.displayName ?? propContentType.key }\n`)
                const propContentTypeInfo = createInitialFragment(propContentType, true)
                fs.writeFileSync(propertyFragmentFile, propContentTypeInfo.fragment)
                if (Array.isArray(propContentTypeInfo.propertyTypes))
                    newDependencies.push(...propContentTypeInfo.propertyTypes)
            }
        })
        dependencies = newDependencies
    }
}

function createInitialFragment(contentType : IntegrationApi.ContentType, forProperty: boolean = false) : { fragment: string, propertyTypes: ([ string, boolean ][] | null) }
{
    const propertyTypes : [ string, boolean ][] = []
    const fragmentFields : string[] = []
    const typeProps = contentType.properties ?? {}
    Object.getOwnPropertyNames(typeProps).forEach(propKey => {
        // Exclude system properties, which are not present in Optimizely Graph
        if (['experience','section'].includes(contentType.baseType) && ['AdditionalData','UnstructuredData','Layout'].includes(propKey))
            return

        // Write the property
        switch ((typeProps[propKey] as IntegrationApi.ContentTypeProperty).type) {
            case "array":
                switch ((typeProps[propKey] as IntegrationApi.ListProperty).items.type) {
                    case "content":
                        if (contentType.baseType == 'page' || (contentType.baseType as string) == 'experience')
                            fragmentFields.push(`${ propKey } { ...BlockData }`)
                        else
                            fragmentFields.push(`${ propKey } { ...IContentListItem }`)
                        break;
                    case "component":
                        const componentType = ((typeProps[propKey] as IntegrationApi.ListProperty).items  as IntegrationApi.ComponentProperty).contentType
                        switch (componentType) {
                            case 'link':
                                fragmentFields.push(`${ propKey } { ...LinkItemData }`)
                                break;
                            default:
                                fragmentFields.push(`${ propKey } { ...${ componentType }Data }`)
                                break;
                        }
                        break;
                    default:
                        fragmentFields.push(`${ propKey } { __typename }`)
                        break;
                }
                break;
            case "string":
                if ((typeProps[propKey] as IntegrationApi.StringProperty).format == "html")
                    fragmentFields.push(`${ propKey } { json, html }`)
                else
                    fragmentFields.push(propKey)
                break;
            case "url":
                fragmentFields.push(`${ propKey } { ...LinkData }`)
                break;
            case "contentReference":
                fragmentFields.push(`${ propKey } { ...ReferenceData }`)
                break;
            case "component":
                const componentType = (typeProps[propKey] as IntegrationApi.ComponentProperty).contentType
                fragmentFields.push(`${ propKey } { ...${ componentType }PropertyData }`)
                propertyTypes.push([componentType, true])
                break;
            default:
                fragmentFields.push(propKey)
                break;
        }
    })

    if (fragmentFields.length == 0)
        fragmentFields.push('_metadata { key }')

    const tpl = `fragment ${ contentType.key }${ forProperty ? 'Property' : ''}Data on ${ contentType.key }${ forProperty ? 'Property' : ''} {
  ${ fragmentFields.join("\n  ") }
}`
    return {
        fragment: tpl,
        propertyTypes: propertyTypes.length == 0 ? null : propertyTypes
    }
}