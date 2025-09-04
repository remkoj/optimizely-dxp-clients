import { type IntegrationApi } from '@remkoj/optimizely-cms-api'
import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'
import figures from 'figures'
import { parseArgs } from '../tools/parseArgs.js'
import { createCmsClient } from '../tools/cmsClient.js'
import { getStyles } from '../tools/styles.js'
import { type NextJsModule, builder } from './_nextjs_base.js'
import createStyles from './styles_pull.js'

export const NextJsVisualBuilderCommand: NextJsModule = {
  command: "nextjs:visualbuilder",
  describe: "Create the React Components for Visual Builder in a Next.JS / Optimizely Graph structure",
  builder,
  handler: async (args) => {
    // Prepare
    const { components: basePath, _config: { debug }, force } = parseArgs(args)

    // Create the fall-back node and style defintions
    await createStyles.handler({ ...args, excludeNodeTypes: [], excludeTemplates: [], nodes: [], templates: [], templateTypes: ['node'], definitions: true })
    createGenericNode(basePath, force, debug)

    // Get all styles
    const { styles } = await getStyles(createCmsClient(args), { ...args, excludeNodeTypes: [], excludeTemplates: [], nodes: [], templates: [], templateTypes: ['node', 'base'] })

    // Process node styles
    styles.filter(x => typeof (x.nodeType) == 'string' && x.nodeType.length > 0).map(styleDefintion => {
      const templatePath = path.join(basePath, 'nodes', styleDefintion.nodeType, styleDefintion.key)
      createSpecificNode(styleDefintion, templatePath, force, debug)
    })

    // Process base styles
    styles.filter(x => typeof (x.baseType) == 'string' && x.baseType.length > 0).map(styleDefinition => {
      const templatePath = path.join(basePath, styleDefinition.baseType, 'styles', styleDefinition.key)
      createSpecificNode(styleDefinition, templatePath, force, debug)
    })

  }
}

export default NextJsVisualBuilderCommand

function createSpecificNode(template: IntegrationApi.DisplayTemplate, templatePath: string, force: boolean = false, debug: boolean = false) {
  const nodeFile = path.join(templatePath, 'index.tsx')
  if (fs.existsSync(nodeFile)) {
    if (!force) {
      if (debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${template.displayName} (${template.key}) component - file already exists\n`))
      return undefined
    }
    if (debug)
      process.stdout.write(chalk.gray(`${figures.arrowRight} Overwriting ${template.displayName} (${template.key}) component\n`))
  } else if (debug)
    process.stdout.write(chalk.gray(`${figures.arrowRight} Creating ${template.displayName} (${template.key}) component\n`))

  if (!fs.existsSync(templatePath))
    fs.mkdirSync(templatePath, { recursive: true })

  const baseType = template.nodeType ?? template.baseType ?? 'unknown';
  const displayTemplateName = getDisplayTemplateInfo(template, templatePath);
  const imports: string[] = ['import { extractSettings, type CmsLayoutComponent } from "@remkoj/optimizely-cms-react/rsc";'];
  const componentProps = [`className="vb:${baseType} vb:${baseType}:${template.key}"`]
  const componentArgs = ['layoutProps', 'children']
  let componentType = 'div'
  if (displayTemplateName)
    imports.push(`import { ${displayTemplateName} } from "../displayTemplates";`)
  if (baseType.toLowerCase() == 'section') {
    imports.push('import { CmsEditable } from "@remkoj/optimizely-cms-react/rsc";')
    componentType = 'CmsEditable'
    componentProps.push('{ ...editProps }')
    componentArgs.push('editProps')
  }

  const component = `${imports.join("\n")}

export const ${template.key} : CmsLayoutComponent<${displayTemplateName ?? '{}'}> = ({ ${componentArgs.join(', ')} }) => {
    const layout = extractSettings(layoutProps);
    return (<${componentType} ${componentProps.join(' ')}>{ children }</${componentType}>);
}

export default ${template.key};`

  fs.writeFileSync(nodeFile, component)
}

function createGenericNode(basePath: string, force: boolean, debug: boolean) {
  const nodeItem = path.join(basePath, 'node.tsx')
  if (fs.existsSync(nodeItem)) {
    if (!force) {
      if (debug)
        process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping generic node component - file already exists\n`))
      return undefined
    }
    if (debug)
      process.stdout.write(chalk.gray(`${figures.arrowRight} Overwriting generic node component\n`))
  } else if (debug)
    process.stdout.write(chalk.gray(`${figures.arrowRight} Creating generic node component\n`))

  const nodeContent = `import { CmsEditable, type CmsLayoutComponent } from '@remkoj/optimizely-cms-react/rsc'

export const VisualBuilderNode : CmsLayoutComponent = ({ editProps, layoutProps, children }) =>
{
    let className = \`vb:\${layoutProps?.layoutType}\`
    if (layoutProps && layoutProps.layoutType == "section")
        return <CmsEditable as="div" className={ className } {...editProps}>{ children }</CmsEditable>
    return <div className={ className }>{ children }</div>
}

export default VisualBuilderNode`
  fs.writeFileSync(nodeItem, nodeContent)
}

function getDisplayTemplateInfo(template: IntegrationApi.DisplayTemplate, typePath: string) {
  const displayTemplatesFile = path.join(typePath, '..', 'displayTemplates.ts')
  if (fs.existsSync(displayTemplatesFile)) {
    const displayTemplateContent = fs.readFileSync(displayTemplatesFile).toString()
    const displayTemplateName = template.key + 'Props'
    if (displayTemplateContent.includes(`export type ${displayTemplateName} =`)) {
      return displayTemplateName
    }
  }
  return undefined
}