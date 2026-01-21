/**
 * This file contains tools that allow using the project that we're targeting
 */
import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'
import { type CmsIntegrationApiClient as CmsApiClient, type IntegrationApi } from '@remkoj/optimizely-cms-api'
import slugify, { type Options as SlugifyOptions } from '@sindresorhus/slugify'

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
  const baseTypeSlug = keyToSlug(contentType.baseType, { 
    defaultKey: 'global',
    stripLeadingUnderscore: true
  })
  const typeSlug = keyToSlug(contentType.key)
  const typePath = path.join(basePath, baseTypeSlug, typeSlug)

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

  const typeFile = path.join(typePath, `${typeSlug}.opti-type.json`);
  const fragmentFile = path.join(typePath, `${typeSlug}.${baseTypeSlug}.graphql`);
  const propertyFragmentFile = path.join(typePath, `${typeSlug}.property.graphql`);
  const queryFile = path.join(typePath, `${typeSlug}.query.graphql`);
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

export type StyleFilePaths = {
  /**
   * The absolute path for the *.opti-style.json file
   */
  styleFile: string
  /**
   * The absolute path for folder containing the template
   * specific files.
   */
  styleFolder: string
  /**
   * The absolute path for the displayTemplates.ts file
   */
  helperFile: string
  /**
   * The absolute path for folder containing the template
   * displayTemplates.ts file
   */
  helperFolder: string
  /**
   * Textual identifier of the style definition
   */
  identifier: string
}

export function getStyleFilePathsSync(displayTemplate: IntegrationApi.DisplayTemplate, contentBaseType: IntegrationApi.ContentType['baseType'] = '_Component', basePath: string = './src/components/cms', createFolder: boolean = false): StyleFilePaths {
  const displayTemplateType = getDisplayTemplateType(displayTemplate);
  let target: string;
  let groupPath: string;
  switch (displayTemplateType) {
    case 'base':
      groupPath = path.join(keyToSlug(displayTemplate.baseType, { stripLeadingUnderscore: true }), 'styles');
      target = displayTemplate.baseType;
      break;
    case 'node':
      groupPath = path.join('nodes', keyToSlug(displayTemplate.nodeType));
      target = displayTemplate.baseType;
      break;
    case 'component':
      const baseType = contentBaseType;
      target = displayTemplate.contentType;
      groupPath = path.join(
        keyToSlug(baseType, { stripLeadingUnderscore: true }),
        keyToSlug(displayTemplate.contentType, { stripLeadingGroup: true })
      )
      break;
    default:
      throw new Error(`Unsupported DisplayTemplate target for ${ displayTemplate.key }`)
  }
  const displayTemplateKeySlug = keyToSlug(displayTemplate.key ?? 'displayTemplate', { stripLeadingGroup: true });
  const groupFolder = path.join(basePath, groupPath);
  const styleFolder = displayTemplateType === 'component' ? groupFolder : path.join(groupFolder, displayTemplateKeySlug);

  if (createFolder && !fs.existsSync(styleFolder))
    fs.mkdirSync(styleFolder, { recursive: true });

  return {
    styleFile: path.join(styleFolder, displayTemplateKeySlug+'.opti-style.json'),
    helperFile: path.join(groupFolder, 'displayTemplates.ts'),
    identifier: `${ displayTemplateType }/${target}`,
    helperFolder: groupFolder,
    styleFolder
  }
}

export async function getStyleFilePaths(definition: IntegrationApi.DisplayTemplate, opts?: { contentBaseType?: IntegrationApi.ContentType['baseType'], client?: CmsApiClient, basePath?: string, createFolder?: boolean }): Promise<StyleFilePaths> {
  let defintionBaseType = undefined;
  if (definition.contentType && !opts.contentBaseType && opts.client) {
    const contentType = await opts.client.contentTypesGet({ path: { key: definition.contentType }}).catch(() => undefined as IntegrationApi.ContentType)
    defintionBaseType = contentType?.baseType
  } else {
    defintionBaseType = opts.contentBaseType;
  }
  return getStyleFilePathsSync(definition, defintionBaseType, opts.basePath, opts.createFolder);
}

export type KeyToSlugOptions = {
  /**
   * Optimizely CMS prefixes the key with the group (groupname:keyValue), this
   * will be stripped by default to keep shorter file paths.
   * 
   * @default true
   */
  readonly stripLeadingGroup: boolean
  /**
   * In case the key is empty (undefined, null or empty string) this value will
   * be used.
   * 
   * @default 'unknown'
   */
  readonly defaultKey: string
  /**
	 * If your string starts with an underscore, it will be preserved in the slugified 
   * string. However, in some cases these can safely be ingored to get a better 
   * developer experience.
   * 
	 * @default true
  */
	readonly stripLeadingUnderscore: boolean;
} & Omit<SlugifyOptions, 'preserveLeadingUnderscore'>

/**
 * Simple logic to create path slugs for storing ContentType related files on
 * disk.
 * 
 * @param   typeKey     
 * @param   stripLeadingUnderscore
 * @returns 
 */
export function keyToSlug(
  typeKey?: string | null, 
  options: Readonly<Partial<KeyToSlugOptions>> = {}
) {
  // Destruct the configuration into the parts we need
  const { stripLeadingGroup = true, defaultKey = 'unknown', stripLeadingUnderscore = false, ...slugifyBaseConfig } = options;
  const slugifyConfig : SlugifyOptions = {
    ...slugifyBaseConfig,
    preserveLeadingUnderscore: !stripLeadingUnderscore
  }

  // First make sure we have a valid input type
  if (!(typeof typeKey === 'string' || typeKey === undefined || typeKey === null))
    throw new Error(`Invalid typeKey provided, expected an optional string, received a value of type ${ typeof typeKey }`);

  // Then, take the prefix out, if any and required
  const toSlugify = stripLeadingGroup && typeKey?.indexOf(":") >= 0 ? typeKey.split(":",2).at(1) : typeKey;

  // Finally slugify the result
  return slugify(toSlugify ?? defaultKey, slugifyConfig);
}

export type DisplayTemplateType = 'base' | 'node' | 'component' | 'unknown'
export function getDisplayTemplateType(displayTemplate: IntegrationApi.DisplayTemplate) : DisplayTemplateType
{
  const templateType: 'base' | 'node' | 'component' | 'unknown' = displayTemplate.baseType ? 'base' : displayTemplate.nodeType ? 'node' : displayTemplate.contentType ? 'component' : 'unknown'
  return templateType;
}
