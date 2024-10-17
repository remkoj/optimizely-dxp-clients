import type { OptiCmsArgs } from '../types.js'
import type { Argv, ArgumentsCamelCase } from 'yargs'
import { ApiClient as CmsApiClient, type IntegrationApi, OptiCmsVersion } from '@remkoj/optimizely-cms-api'
import { parseArgs } from '../tools/parseArgs.js'
import chalk from 'chalk'
import figures from 'figures'
import { getContentTypes } from './contentTypes.js'

import { ContentTypesArgs, contentTypesBuilder } from './contentTypes.js'

export type StylesArgs = ContentTypesArgs & {
    excludeNodeTypes: string[]
    excludeTemplates: string[]
    nodes: string[]
    templates: string[]
    templateTypes: string[]
}

export const stylesBuilder : (yargs: Argv<OptiCmsArgs>) => Argv<OptiCmsArgs<StylesArgs>> = yargs => 
{    
    const newArgs = contentTypesBuilder(yargs)
    newArgs.option('excludeNodeTypes', { alias: 'ent', description: "Exclude these node types", string: true, type: 'array', demandOption: false, default: []})
    newArgs.option('excludeTemplates', { alias: 'et', description: "Exclude these templates", string: true, type: 'array', demandOption: false, default: ['folder','media','image','video']})
    newArgs.option("nodes", { alias: 'n', description: "Select only these node types", string: true, type: 'array', demandOption: false, default: []})
    newArgs.option("templates", { alias: 'd', description: "Select only these templates", string: true, type: 'array', demandOption: false, default: []})
    newArgs.option("templateTypes", { alias: 'tt', description: "Select only these template types", choices: ['node','base','component'], type: 'array', demandOption: false, default: [] })
    return newArgs as Argv<OptiCmsArgs<StylesArgs>>
}

export type GetStylesResult = {all: Array<IntegrationApi.DisplayTemplate>,styles: Array<IntegrationApi.DisplayTemplate>}

export async function getStyles(client: CmsApiClient, args: ArgumentsCamelCase<OptiCmsArgs<StylesArgs>>, pageSize: number = 100) : Promise<GetStylesResult>
{
    if (client.runtimeCmsVersion == OptiCmsVersion.CMS12) return { all: [], styles: [] }
    const { _config: cfg, excludeBaseTypes, excludeTypes, excludeNodeTypes, excludeTemplates, baseTypes, types, nodes, templates, templateTypes } = parseArgs(args)

    process.stdout.write(chalk.yellowBright(`${ figures.arrowRight } Pulling Style-Definitions from Optimizely CMS\n`))

    if (cfg.debug)
        process.stdout.write(chalk.gray(`${ figures.arrowRight } Fetching page 1 of ? (${ pageSize } items per page)\n`))
    let resultsPage = await client.displayTemplates.displayTemplatesList(0, pageSize)
    const results : (typeof resultsPage)["items"] = resultsPage.items ?? []
    let pagesRemaining = Math.ceil(resultsPage.totalItemCount / resultsPage.pageSize) - (resultsPage.pageIndex + 1)

    while (pagesRemaining > 0 && results.length < resultsPage.totalItemCount) {
        if (cfg.debug)
            process.stdout.write(chalk.gray(`${ figures.arrowRight } Fetching page ${ resultsPage.pageIndex + 2 } of ${ Math.ceil(resultsPage.totalItemCount / resultsPage.pageSize) } (${ resultsPage.pageSize } items per page)\n`))
        resultsPage = await client.displayTemplates.displayTemplatesList(resultsPage.pageIndex + 1, resultsPage.pageSize)
        results.push(...resultsPage.items)
        pagesRemaining = Math.ceil(resultsPage.totalItemCount / resultsPage.pageSize) - (resultsPage.pageIndex + 1)
    }

    if (cfg.debug) {
        process.stdout.write(chalk.gray(`${ figures.arrowRight } Fetched ${ results.length } Style-Definitions from Optimizely CMS\n`))
        process.stdout.write(chalk.gray(`${ figures.arrowRight } Filtering Style-Definitions based upon arguments\n`))
    }

    const styles = results.filter(data => {
        if (isExcluded(data.key, excludeTemplates, templates)) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Skipping Style-Defintion ${ data.key } - Style defintion key filtering active\n`))
            return false
        }
        const templateType : string = data.baseType ? 'base' : data.nodeType ? 'node' : data.contentType ? 'component' : 'unknown'
        if (isExcluded(templateType, [], templateTypes)) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Skipping Style-Defintion ${ data.key } - Style type filtering is active\n`))
            return false
        }
        if (data.baseType && isExcluded(data.baseType, excludeBaseTypes, baseTypes)) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Skipping Style-Defintion ${ data.key } - Style is defined at base type level and base type filtering is active\n`))
            return false
        }
        if (data.contentType && isExcluded(data.contentType, excludeTypes, types)) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Skipping Style-Defintion ${ data.key } - Style is defined at component type level and component type filtering is active\n`))
            return false
        }
        if (templateType != 'component' && types.length > 0) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Skipping Style-Defintion ${ data.key } - Style is targeting the ${ templateType } level and component type selection is active\n`))
            return false
        }
        if (data.nodeType && isExcluded(data.nodeType, excludeNodeTypes, nodes)) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Skipping Style-Defintion ${ data.key } - Style is defined at node type level and node type filtering is active\n`))
            return false
        }
        if (templateType != 'node' && nodes.length > 0) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Skipping Style-Defintion ${ data.key } - Style is targeting the ${ templateType } level and node type selection is active\n`))
            return false
        }
        return true
    })

    if (cfg.debug)
        process.stdout.write(chalk.gray(`${ figures.arrowRight } Applied content type filters, reduced from ${ results.length } to ${ styles.length } items\n`))

    return {
        all: results,
        styles
    }
}

function isExcluded<T>(value: T, exclusions: Array<T>, inclusions: Array<T>) : boolean
{
    if (value == undefined || value == null)
        return false
    return exclusions.includes(value) || (inclusions.length > 0 && !inclusions.includes(value))
}

export async function getStyleFilePath(definition: IntegrationApi.DisplayTemplate, opts?: { contentBaseType?: IntegrationApi.ContentBaseType, client?: CmsApiClient}) : Promise<string>
{
    if (definition.nodeType)
        return `nodes/${ definition.nodeType }/${ definition.key }/${ definition.key }.opti-style.json`
    if (definition.baseType)
        return `${ definition.baseType }/styles/${ definition.key }/${ definition.key }.opti-style.json`
    if (definition.contentType) {
        if (opts?.contentBaseType)
            return `${ opts?.contentBaseType }/${ definition.contentType }/${ definition.key }.opti-style.json`
        
        if (!opts?.client)
            throw new Error("Neither the contentBaseType, nor the ApiClient has been provided for a definition for a specific ContentType - unable to generate the path")
        
        const pageSize = 50
        let resultsPage = await opts.client.contentTypes.contentTypesList(undefined, undefined, 0, pageSize)
        const contentTypes : (typeof resultsPage)["items"] = resultsPage.items ?? []
        let pagesRemaining = Math.ceil(resultsPage.totalItemCount / resultsPage.pageSize) - (resultsPage.pageIndex + 1)
    
        while (pagesRemaining > 0 && contentTypes.length < resultsPage.totalItemCount) {
            resultsPage = await opts.client.contentTypes.contentTypesList(undefined, undefined, resultsPage.pageIndex + 1, resultsPage.pageSize)
            contentTypes.push(...resultsPage.items)
            pagesRemaining = Math.ceil(resultsPage.totalItemCount / resultsPage.pageSize) - (resultsPage.pageIndex + 1)
        }

        const fetchedBaseType = contentTypes.filter(x => x.key == definition.contentType).map(x => x.baseType).at(0)
        if (fetchedBaseType)
            return `${ fetchedBaseType }/${ definition.contentType }/${ definition.key }.opti-style.json`

    }
    throw new Error(`Unable to resolve the target for the DisplayTemplate: ${ definition.key }`)
}