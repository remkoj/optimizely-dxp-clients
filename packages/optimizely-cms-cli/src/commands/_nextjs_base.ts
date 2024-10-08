import type { CliModule } from '../types.js'
import { createClient, type ApiClient as CmsApiClient, type IntegrationApi } from '@remkoj/optimizely-cms-api'
import { parseArgs } from '../tools/parseArgs.js'
import chalk from 'chalk'
import figures from 'figures'
import { type ContentTypesArgs, type getContentTypes, contentTypesBuilder } from '../tools/contentTypes.js'
import fs from 'node:fs'
import path from 'node:path'

export type NextJsCommandArgs = ContentTypesArgs & { 
    force: boolean
}

export type NextJsModule<A = any> = CliModule<NextJsCommandArgs, A>

export type TypeFolderList = Array<{
    type: IntegrationApi.ContentType['key'],
    path: string,
}>

export const builder : NextJsModule['builder'] = yargs =>
{
    const updatedArgs = contentTypesBuilder(yargs)
    updatedArgs.option('force', { alias: 'f', description: "Overwrite existing files", boolean: true, type: 'boolean', demandOption: false, default: false })
    return updatedArgs
}

export type Promised<T> = T extends PromiseLike<infer R> ? R : T

export function createTypeFolders(contentTypes: Array<IntegrationApi.ContentType>, basePath: string, debug: boolean = false) : TypeFolderList
{    
    const folders = contentTypes.map(contentType => {

        const baseType = contentType.baseType ?? 'default'

        // Create the type folder
        const typePath = path.join(basePath, baseType, contentType.key)
        if (!fs.existsSync(typePath)) {
            fs.mkdirSync(typePath, { recursive: true })
            if (debug)
                process.stdout.write(chalk.gray(`${ figures.arrowRight } Created folder ${ typePath } for Content-Type ${ contentType.key }\n`))
        }

        // Check folders
        if (!fs.statSync(typePath).isDirectory())
            throw new Error(`The folder ${ typePath } for Content-Type ${ contentType.key } exists, but is not a directory!`)

        return {
            type: contentType.key,
            path: typePath,
        }
    })

    return folders
}

export function getTypeFolder(list: TypeFolderList, type: string) : string | undefined
{
    return list.filter(x => x.type == type).at(0)?.path
}