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


function createComponent(contentType: IntegrationApi.ContentType, typePath: string, force: boolean, debug: boolean = false) {
  const componentFile = path.join(typePath, 'index.tsx')
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
  const varName = `${contentType.key.replaceAll(':','_')}${ucFirst(contentType.baseType ?? 'part')}`
  const tplFn = Templates[contentType.baseType] ?? Templates['default']

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

const Templates: Record<'default', TemplateFn> & Partial<Record<IntegrationApi.ContentBaseType, TemplateFn>> =
{
  // Default Template for all components without specifics
  default: (contentType, varName, displayTemplate, baseDisplayTemplate) => `import { CmsEditable, type CmsComponent } from "@remkoj/optimizely-cms-react/rsc";
import { ${contentType.key}DataFragmentDoc, type ${contentType.key}DataFragment } from "@/gql/graphql";${displayTemplate ? `
import { ${displayTemplate} } from "./displayTemplates";` : ''}${baseDisplayTemplate ? `
import { ${baseDisplayTemplate} } from "../styles/displayTemplates";` : ''}

/**
 * ${contentType.displayName}
 * ${contentType.description}
 */
export const ${varName} : CmsComponent<${contentType.key}DataFragment${(displayTemplate || baseDisplayTemplate) ? ', ' + [displayTemplate, baseDisplayTemplate].filter(x => x).join(" | ") : ''}> = ({ data${(displayTemplate || baseDisplayTemplate) ? ', layoutProps' : ''}, editProps${ contentType.baseType == 'section' ? ', children': ''} }) => {
    const componentName = '${contentType.displayName}'
    const componentInfo = '${contentType.description?.replaceAll("'", "\\'") ?? ''}'
    return <CmsEditable className="w-full border-y border-y-solid border-y-slate-900 py-2 mb-4" {...editProps}>
        <div className="font-bold italic">{ componentName }</div>
        <div>{ componentInfo }</div>
        { Object.getOwnPropertyNames(data).length > 0 && <pre className="w-full overflow-x-hidden font-mono text-sm bg-slate-200 p-2 rounded-sm border border-solid border-slate-900 text-slate-900">{ JSON.stringify(data, undefined, 4) }</pre> }${ contentType.baseType == 'section' ? `
        { children }` : '' }
    </CmsEditable>
}
${varName}.displayName = "${contentType.displayName} (${ucFirst(contentType.baseType)}/${contentType.key})"
${varName}.getDataFragment = () => ['${contentType.key}Data', ${contentType.key}DataFragmentDoc]

export default ${varName}`,

  // Template for all page component types
  page: (contentType, varName, displayTemplate) => `import { type OptimizelyNextPage as CmsComponent } from "@remkoj/optimizely-cms-nextjs";
import { ${contentType.key}DataFragmentDoc, type ${contentType.key}DataFragment } from "@/gql/graphql";${displayTemplate ? `
import { ${displayTemplate} } from "./displayTemplates";` : ''}
import { getSdk } from "@/gql"

/**
 * ${contentType.displayName}
 * ${contentType.description}
 */
export const ${varName} : CmsComponent<${contentType.key}DataFragment${displayTemplate ? ', ' + displayTemplate : ''}> = ({ data${displayTemplate ? ', layoutProps' : ''} }) => {
    const componentName = '${contentType.displayName}'
    const componentInfo = '${contentType.description?.replaceAll("'", "\\'") ?? ''}'
    return <div className="mx-auto px-2 container">
        <div className="font-bold italic">{ componentName }</div>
        <div>{ componentInfo }</div>
        { Object.getOwnPropertyNames(data).length > 0 && <pre className="w-full overflow-x-hidden font-mono text-sm bg-slate-200 p-2 rounded-sm border border-solid border-slate-900 text-slate-900">{ JSON.stringify(data, undefined, 4) }</pre> }
    </div>
}
${varName}.displayName = "${contentType.displayName} (${ucFirst(contentType.baseType)}/${contentType.key})"
${varName}.getDataFragment = () => ['${contentType.key}Data', ${contentType.key}DataFragmentDoc]
${varName}.getMetaData = async (contentLink, locale, client) => {
    const sdk = getSdk(client);
    // Add your metadata logic here
    return {}
}

export default ${varName}`,

  // Template for all experience component types
  experience: (contentType, varName, displayTemplate) => `import { type OptimizelyNextPage as CmsComponent } from "@remkoj/optimizely-cms-nextjs";
import { getFragmentData } from "@/gql/fragment-masking";
import { ExperienceDataFragmentDoc, ${contentType.key}DataFragmentDoc, type ${contentType.key}DataFragment } from "@/gql/graphql";
import { OptimizelyComposition, isNode, CmsEditable } from "@remkoj/optimizely-cms-react/rsc";${displayTemplate ? `
import { ${displayTemplate} } from "./displayTemplates";` : ''}
import { getSdk } from "@/gql"

/**
 * ${contentType.displayName}
 * ${contentType.description}
 */
export const ${varName} : CmsComponent<${contentType.key}DataFragment${displayTemplate ? ', ' + displayTemplate : ''}> = ({ data${displayTemplate ? ', layoutProps' : ''}, ctx }) => {
    const composition = getFragmentData(ExperienceDataFragmentDoc, data)?.composition
    return <CmsEditable as="div" className="mx-auto px-2 container" cmsFieldName="unstructuredData" ctx={ctx}>
        { composition && isNode(composition) && <OptimizelyComposition node={composition} ctx={ctx} /> }
    </CmsEditable>
}
${varName}.displayName = "${contentType.displayName} (${ucFirst(contentType.baseType)}/${contentType.key})"
${varName}.getDataFragment = () => ['${contentType.key}Data', ${contentType.key}DataFragmentDoc]
${varName}.getMetaData = async (contentLink, locale, client) => {
    const sdk = getSdk(client);
    // Add your metadata logic here
    return {}
}

export default ${varName}`
}
