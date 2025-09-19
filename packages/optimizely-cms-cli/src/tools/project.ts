/**
 * This file contains tools that allow using the project that we're targeting
 */
import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'
import { type IntegrationApi } from '@remkoj/optimizely-cms-api'

export type ContentTypePathInfo = {
  /**
   * The key of the ContentType in Optimizely CMS
   */
  type: string
  /**
   * The base path where all files for this ContentType must be stored
   */
  path: string
  /**
   * The base path where all files for this ContentType must be stored
   * 
   * @deprecated  Use `path`
   */
  typePath: string
  /**
   * The full path, including filename for the *.opti-type.json file
   */
  typeFile: string
  /**
   * The full path, including filename for the GraphQL Fragment to load this component
   */
  fragmentFile: string
  /**
   * The full path, including filename for the React Component used to render this 
   * Content Type
   */
  componentFile: string
  /**
   * The full path, including filename for the GraphQL Fragment to load this component
   * as a property within another component
   */
  propertyFragmentFile: string
  /**
   * The full path, including filename for the GraphQL Query to load the data for this
   * Content-Type by ID
   */
  queryFile: string
}

/**
 * Get all the file paths for the content type, taking the current project configuration into
 * account.
 * 
 * @param contentType 
 * @param basePath 
 * @returns 
 */
export function getContentTypePaths(contentType: IntegrationApi.ContentType, basePath: string, createFolder: boolean = false, debug: boolean = false): ContentTypePathInfo {
  const baseTypeSlug = typeToSlug(contentType.baseType)
  const typePath = path.join(basePath, baseTypeSlug, contentType.key)

  if (createFolder) {
    if (!fs.existsSync(typePath)) {
      fs.mkdirSync(typePath, { recursive: true })
      if (debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Created folder ${typePath} for Content-Type ${contentType.key}\n`))
    }

    // Check folders
    if (!fs.statSync(typePath).isDirectory())
      throw new Error(`The folder ${typePath} for Content-Type ${contentType.key} exists, but is not a directory!`)
  }

  const typeFile = path.join(typePath, `${contentType.key}.opti-type.json`);
  const fragmentFile = path.join(typePath, `${contentType.key}.${baseTypeSlug}.graphql`);
  const propertyFragmentFile = path.join(typePath, `${contentType.key}.property.graphql`);
  const queryFile = path.join(typePath, `get${contentType.key}Data.query.graphql`);
  const componentFile = path.join(typePath, `index.tsx`);

  return {
    type: contentType.key,
    path: typePath,
    typePath,
    typeFile,
    fragmentFile,
    componentFile,
    propertyFragmentFile,
    queryFile
  }
}

/**
 * 
 * @param typeKey 
 * @returns 
 */
export function typeToSlug(typeKey: string) {
  let typeKeySlug = typeKey.toLowerCase()
  if (typeKeySlug.startsWith('_'))
    typeKeySlug = typeKeySlug.substring(1)
  return typeKeySlug
}