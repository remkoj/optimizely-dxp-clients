import { type IntegrationApi } from '@remkoj/optimizely-cms-api'
import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'

import { parseArgs } from '../tools/parseArgs.js'
import { createCmsClient } from '../tools/cmsClient.js'
import { getContentTypes, type GetContentTypesResult } from '../tools/contentTypes.js'
import { type NextJsModule, builder, createTypeFolders, getTypeFolder, type TypeFolderList } from './_nextjs_base.js'

export const NextJsQueriesCommand : NextJsModule<{ loadedContentTypes: GetContentTypesResult, createdTypeFolders: TypeFolderList}> = {
    command: "nextjs:fragments",
    describe: "Create the GrapQL Fragments for a Next.JS / Optimizely Graph structure",
    builder,
    handler: async (args, opts) => {
        // Prepare
        const { loadedContentTypes, createdTypeFolders } = opts || {}
        const { components: basePath, _config: { debug }, force } = parseArgs(args)
        const { contentTypes, all: allContentTypes} = loadedContentTypes ?? await getContentTypes(createCmsClient(args), args)

        // Start process
        process.stdout.write(chalk.yellowBright(`${ figures.arrowRight } Generating GraphQL fragments for ${ contentTypes.map(x=>x.key).join(', ') }\n`))
        const typeFolders = createdTypeFolders ?? createTypeFolders(contentTypes, basePath, debug)
        const updatedTypes = contentTypes.map(contentType => {
            const typePath = getTypeFolder(typeFolders, contentType.key)
            return createGraphFragments(contentType, typePath, basePath, force, debug, allContentTypes)
        }).filter(x => x).flat()

        // Report outcome
        if (updatedTypes.length > 0)
            process.stdout.write(chalk.yellowBright(`${ figures.arrowRight } Created/updated GraphQL fragments for ${ updatedTypes.join(', ') }\n`))
        else
            process.stdout.write(chalk.yellowBright(`${ figures.arrowRight } No GraphQL fragments created/updated\n`))
        if (!opts) process.stdout.write(chalk.green(chalk.bold(figures.tick+" Done"))+"\n")
    }
}

function createGraphFragments(contentType : IntegrationApi.ContentType, typePath: string, basePath: string, force: boolean, debug: boolean, contentTypes : IntegrationApi.ContentType[]) : Array<string> | undefined
{
    const returnValue : Array<string> = []
    const baseType = contentType.baseType ?? 'default'
    const baseQueryFile = path.join(typePath, `${ contentType.key }.${ baseType }.graphql`)
    if (fs.existsSync(baseQueryFile)) {
        if (force) {
            if (debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Overwriting ${ contentType.displayName } (${ contentType.key }) base fragment\n`))
        } else {
            if (debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Skipping ${ contentType.displayName } (${ contentType.key }) base fragment - file already exists\n`))
            return undefined
        }
    } else if (debug) {
        process.stdout.write(chalk.gray(`${ figures.arrowRight } Creating ${ contentType.displayName } (${ contentType.key }) base fragment\n`))
    }

    const { fragment, propertyTypes } = createInitialFragment(contentType)
    fs.writeFileSync(baseQueryFile, fragment)
    returnValue.push(contentType.key)

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
                if (debug)
                    process.stdout.write(chalk.gray(`${ figures.arrowRight } Writing ${ propContentType.displayName } (${ propContentType.key }) property fragment\n`))
                const propContentTypeInfo = createInitialFragment(propContentType, true)
                fs.writeFileSync(propertyFragmentFile, propContentTypeInfo.fragment)
                returnValue.push(propContentType.key)
                if (Array.isArray(propContentTypeInfo.propertyTypes))
                    newDependencies.push(...propContentTypeInfo.propertyTypes)
            }
        })
        dependencies = newDependencies
    }
    return returnValue.length > 0 ? returnValue : undefined
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

    if ((contentType.baseType as string) == "experience")
        fragmentFields.push('...ExperienceData')

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

export default NextJsQueriesCommand
