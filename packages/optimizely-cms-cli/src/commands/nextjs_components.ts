import { type IntegrationApi } from '@remkoj/optimizely-cms-api'
import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'

import { parseArgs } from '../tools/parseArgs.js'
import { createCmsClient } from '../tools/cmsClient.js'
import { getContentTypes, type GetContentTypesResult } from '../tools/contentTypes.js'
import { ucFirst } from '../tools/string.js'
import { type NextJsModule, builder, createTypeFolders, getTypeFolder, type TypeFolderList } from './_nextjs_base.js'

export const NextJsComponentsCommand: NextJsModule<{ loadedContentTypes: GetContentTypesResult, createdTypeFolders: TypeFolderList }> = {
  command: "nextjs:components",
  describe: "Create the React Components for a Next.JS / Optimizely Graph structure",
  builder,
  handler: async (args, opts) => {
    // Prepare
    const { loadedContentTypes, createdTypeFolders } = opts || {}
    const { components: basePath, _config: { debug }, force } = parseArgs(args)
    const { contentTypes } = loadedContentTypes ?? await getContentTypes(createCmsClient(args), args)

    // Start process
    process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Generating React Components for ${contentTypes.map(x => x.key).join(', ')}\n`))
    const typeFolders = createdTypeFolders ?? createTypeFolders(contentTypes, basePath, debug)
    const updatedTypes = contentTypes.map(contentType => {
      const typePath = getTypeFolder(typeFolders, contentType.key)
      return createComponent(contentType, typePath, force, debug)
    }).filter(x => x)

    // Report outcome
    if (updatedTypes.length > 0)
      process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Created/updated React Components for ${updatedTypes.join(', ')}\n`))
    else
      process.stdout.write(chalk.yellowBright(`${figures.arrowRight} No React Components created/updated\n`))
    if (!opts) process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n")
  }
}

export default NextJsComponentsCommand


function createComponent(contentType: IntegrationApi.ContentType, typePathInfo: TypeFolderList[number], force: boolean, debug: boolean = false) {
  const { componentFile, path: typePath } = typePathInfo
  if (fs.existsSync(componentFile)) {
    if (!force) {
      if (debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${contentType.displayName} (${contentType.key}) component - file already exists\n`))
      return undefined
    }
    if (debug)
      process.stdout.write(chalk.gray(`${figures.arrowRight} Overwriting ${contentType.displayName} (${contentType.key}) component\n`))
  } else if (debug)
    process.stdout.write(chalk.gray(`${figures.arrowRight} Creating ${contentType.displayName} (${contentType.key}) component\n`))

  // Get type information & short-hands
  const displayTemplate = getDisplayTemplateInfo(contentType, typePath)
  const baseDisplayTemplate = getBaseTypeTemplateInfo(contentType, typePath)
  const normalizedBaseType = normalizeBaseType(contentType.baseType ?? 'part')
  const varName = `${contentType.key}${ucFirst(normalizedBaseType)}`
  const tplFn = Templates[normalizedBaseType] ?? Templates['default']

  if (!tplFn) {
    if (debug)
      process.stdout.write(chalk.redBright(`${figures.cross} Skipping ${contentType.displayName} (${contentType.key}) component - no template for ${contentType.baseType} found\n`))
    return undefined
  }

  // Apply template
  fs.writeFileSync(componentFile, tplFn(contentType, varName, displayTemplate, baseDisplayTemplate))
  return contentType.key
}

function getBaseTypeTemplateInfo(contentType: IntegrationApi.ContentType, typePath: string) {
  const displayTemplatesFile = path.join(typePath, '..', 'styles', 'displayTemplates.ts')
  if (fs.existsSync(displayTemplatesFile)) {
    const baseTypeVarName = contentType.baseType ? contentType.baseType[0].toUpperCase() + contentType.baseType.substring(1) : undefined
    if (!baseTypeVarName)
      return undefined
    const displayTemplateContent = fs.readFileSync(displayTemplatesFile).toString()
    const displayTemplateName = baseTypeVarName + 'LayoutProps'
    if (displayTemplateContent.includes(`export type ${displayTemplateName} =`)) {
      return displayTemplateName
    }
  }
  return undefined
}

function normalizeBaseType(baseType: string): string {
  if (baseType.startsWith('_'))
    return baseType.substring(1)
  return baseType
}

function getDisplayTemplateInfo(contentType: IntegrationApi.ContentType, typePath: string) {
  const displayTemplatesFile = path.join(typePath, 'displayTemplates.ts')
  if (fs.existsSync(displayTemplatesFile)) {
    const displayTemplateContent = fs.readFileSync(displayTemplatesFile).toString()
    const displayTemplateName = contentType.key + 'LayoutProps'
    if (displayTemplateContent.includes(`export type ${displayTemplateName} =`)) {
      return displayTemplateName
    }
  }
  return undefined
}

type TemplateFn = (contentType: IntegrationApi.ContentType, varName: string, displayTemplate?: string, baseDisplayTemplate?: string) => string

const Templates: Record<'default', TemplateFn> & Partial<Record<Required<IntegrationApi.ContentType>['baseType'], TemplateFn>> =
{
  // Default Template for all components without specifics
  default: (contentType, varName, displayTemplate, baseDisplayTemplate) => `import { CmsEditable, type CmsComponent } from "@remkoj/optimizely-cms-react/rsc";
import { ${contentType.key}DataFragmentDoc, type ${contentType.key}DataFragment } from "@/gql/graphql";${displayTemplate ? `
import { ${displayTemplate} } from "./displayTemplates";` : ''}${baseDisplayTemplate ? `
import { ${baseDisplayTemplate} } from "../styles/displayTemplates";` : ''}

/**
 * ${contentType.displayName}
 * ---
 * ${contentType.description}
 */
export const ${varName} : CmsComponent<${contentType.key}DataFragment${(displayTemplate || baseDisplayTemplate) ? ', ' + [displayTemplate, baseDisplayTemplate].filter(x => x).join(" | ") : ''}> = ({ data${(displayTemplate || baseDisplayTemplate) ? ', layoutProps' : ''}, editProps }) => {
    const componentName = '${contentType.displayName}'
    const componentInfo = '${contentType.description?.replaceAll("'", "\\'") ?? ''}'
    return <CmsEditable className="w-full border-y border-y-solid border-y-slate-900 py-2 mb-4" {...editProps}>
        <div className="font-bold italic">{ componentName }</div>
        <div>{ componentInfo }</div>
        { Object.getOwnPropertyNames(data).length > 0 && <pre className="w-full overflow-x-hidden font-mono text-sm bg-slate-200 p-2 rounded-sm border border-solid border-slate-900 text-slate-900">{ JSON.stringify(data, undefined, 4) }</pre> }
    </CmsEditable>
}
${varName}.displayName = "${contentType.displayName} (${ucFirst(contentType.baseType)}/${contentType.key})"
${varName}.getDataFragment = () => ['${contentType.key}Data', ${contentType.key}DataFragmentDoc]

export default ${varName}`,

  // Default Template for all section types
  section: (contentType, varName, displayTemplate, baseDisplayTemplate) => `import { CmsEditable, type CmsComponent } from "@remkoj/optimizely-cms-react/rsc";
import { ${contentType.key}DataFragmentDoc, type ${contentType.key}DataFragment } from "@/gql/graphql";${displayTemplate ? `
import { ${displayTemplate} } from "./displayTemplates";` : ''}${baseDisplayTemplate ? `
import { ${baseDisplayTemplate} } from "../styles/displayTemplates";` : ''}

/**
 * ${contentType.displayName}
 * ---
 * ${contentType.description}
 */
export const ${varName} : CmsComponent<${contentType.key}DataFragment${(displayTemplate || baseDisplayTemplate) ? ', ' + [displayTemplate, baseDisplayTemplate].filter(x => x).join(" | ") : ''}> = ({ data${(displayTemplate || baseDisplayTemplate) ? ', layoutProps' : ''}, editProps, children }) => {
    const componentName = '${contentType.displayName}'
    const componentInfo = '${contentType.description?.replaceAll("'", "\\'") ?? ''}'
    return <CmsEditable className="w-full border-y border-y-solid border-y-slate-900 py-2 mb-4" {...editProps}>
        <div className="font-bold italic">{ componentName }</div>
        <div>{ componentInfo }</div>
        { Object.getOwnPropertyNames(data).length > 0 && <pre className="w-full overflow-x-hidden font-mono text-sm bg-slate-200 p-2 rounded-sm border border-solid border-slate-900 text-slate-900">{ JSON.stringify(data, undefined, 4) }</pre> }
        ${(displayTemplate || baseDisplayTemplate) ? '<pre className="w-full overflow-x-hidden font-mono text-sm bg-slate-200 p-2 rounded-sm border border-solid border-slate-900 text-slate-900">{ JSON.stringify(layoutProps, undefined, 4) }</pre>' : '{/* This component doesn\'t have layout options */}'}
        <div>{ children }</div>
    </CmsEditable>
}
${varName}.displayName = "${contentType.displayName} (${ucFirst(contentType.baseType)}/${contentType.key})"
${varName}.getDataFragment = () => ['${contentType.key}Data', ${contentType.key}DataFragmentDoc]

export default ${varName}`,

  // Template for all page component types
  page: (contentType, varName, displayTemplate) => `import { type OptimizelyNextPage as CmsComponent } from "@remkoj/optimizely-cms-nextjs";
import { get${contentType.key}DataDocument, type get${contentType.key}DataQuery } from '@/gql/graphql'${displayTemplate ? `
import { ${displayTemplate} } from "./displayTemplates";` : ''}
import { getSdk } from "@/gql"

/**
 * ${contentType.displayName}
 * ---
 * ${contentType.description}
 * 
 * This component uses the content query that is auto-generated with the Optimizely CMS Preset for GraphQL Codegen, if you need 
 * to override this query create a GraphQL file (for example: \`get${contentType.key}Data.query.graphql\`) in the same folder as
 * this file. This file must include a GraphQL query with the name \`get${contentType.key}Data\`. 
 * 
 * [Documentation: Customizing queries](https://github.com/remkoj/optimizely-dxp-clients/blob/main/packages/optimizely-graph-functions/docs/customizing_queries.md)
 */
export const ${varName} : CmsComponent<get${contentType.key}DataQuery${displayTemplate ? ', ' + displayTemplate : ''}> = ({ data${displayTemplate ? ', layoutProps' : ''} }) => {
    const componentName = '${contentType.displayName}'
    const componentInfo = '${contentType.description?.replaceAll("'", "\\'") ?? ''}'
    return <div className="mx-auto px-2 container">
        <div className="font-bold italic">{ componentName }</div>
        <div>{ componentInfo }</div>
        { Object.getOwnPropertyNames(data).length > 0 && <pre className="w-full overflow-x-hidden font-mono text-sm bg-slate-200 p-2 rounded-sm border border-solid border-slate-900 text-slate-900">{ JSON.stringify(data, undefined, 4) }</pre> }
    </div>
}
${varName}.displayName = "${contentType.displayName} (${ucFirst(contentType.baseType)}/${contentType.key})"
${varName}.getDataQuery = () => get${contentType.key}DataDocument
${varName}.getMetaData = async (contentLink, locale, client) => {
    const sdk = getSdk(client);
    // Add your metadata logic here
    return {}
}

export default ${varName}`,

  // Template for all experience component types
  experience: (contentType, varName, displayTemplate) => `import { type OptimizelyNextPage as CmsComponent } from "@remkoj/optimizely-cms-nextjs";
import { ExperienceDataFragmentDoc, get${contentType.key}DataDocument, type get${contentType.key}DataQuery } from '@/gql/graphql'
import { getFragmentData } from '@/gql/fragment-masking'
import { OptimizelyComposition, isNode, CmsEditable } from "@remkoj/optimizely-cms-react/rsc";${displayTemplate ? `
import { ${displayTemplate} } from "./displayTemplates";` : ''}
import { getSdk } from "@/gql/client"

/**
 * ${contentType.displayName}
 * ---
 * ${contentType.description}
 * 
 * This component uses the content query that is auto-generated with the Optimizely CMS Preset for GraphQL Codegen, if you need 
 * to override this query create the file \`${contentType.key}.query.graphql\` in the same folder as this file. This file then
 * must include a GraphQL query with the name \`get${contentType.key} Data\`. 
 * 
 * [Documentation: Customizing queries](https://github.com/remkoj/optimizely-dxp-clients/blob/main/packages/optimizely-graph-functions/docs/customizing_queries.md)
 */
export const ${varName} : CmsComponent<get${contentType.key}DataQuery${displayTemplate ? ', ' + displayTemplate : ''}> = ({ data${displayTemplate ? ', layoutProps' : ''}, ctx }) => {
  if (ctx) ctx.editableContentIsExperience = true
  const composition = getFragmentData(ExperienceDataFragmentDoc, data).composition
  const componentName = '${contentType.displayName}'
  const componentInfo = '${contentType.description?.replaceAll("'", "\\'") ?? ''}'
  return <CmsEditable as="div" className="mx-auto px-2 container" cmsFieldName="unstructuredData" ctx={ctx}>
      <div className="font-bold italic">{ componentName }</div>
      <div>{ componentInfo }</div>
      { composition && isNode(composition) && <OptimizelyComposition node={composition} ctx={ctx} /> }
  </CmsEditable>
}
${varName}.displayName = "${contentType.displayName} (${ucFirst(contentType.baseType)}/${contentType.key})"
${varName}.getDataQuery = () => get${contentType.key}DataDocument
${varName}.getMetaData = async (contentLink, locale, client) => {
    const sdk = getSdk(client);
    // Add your metadata logic here
    return {}
}

export default ${varName}`
}