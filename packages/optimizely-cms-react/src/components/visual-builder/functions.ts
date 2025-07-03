import { isContentType } from '../../utilities.js'
import { isContentLink, ContentLinkWithLocale, isInlineContentLink, InlineContentLinkWithLocale } from '@remkoj/optimizely-graph-client'
import type { CompositionNode, LeafPropsFactory, CompositionComponentNode, NodePropsFactory, CompositionStructureNode } from './types.js'

/**
 * Test if the Node within VisualBuilder is an Element
 * 
 * @deprecated      Visual Builder has been updated to favour components over Elements
 * @param           node        The Node to test
 * @returns         `true` if the Node is an element, `false` otherwise.
 */
export function isElementNode(node: CompositionNode<Record<string, any>>): node is CompositionComponentNode<Record<string, any>> {
  return isComponentNode(node)
}

/**
 * Test if the Node within VisualBuilder is a Component
 * 
 * @param           node        The Node to test
 * @returns         `true` if the Node is an element, `false` otherwise.
 */
export function isComponentNode(node: CompositionNode<Record<string, any>>): node is CompositionComponentNode<Record<string, any>> {
  return node.layoutType == "component"
}

export function isComponentNodeOfType<ET extends Record<string, any>>(node: CompositionNode<Record<string, any>>, test: (data: Record<string, any>) => data is ET): node is CompositionComponentNode<ET> {
  if (!isComponentNode(node))
    return false
  return test(node.component)
}

export function isStructureNode(node: CompositionNode<Record<string, any>>): node is CompositionStructureNode {
  return !isComponentNode(node)
}

/**
 * Test if the provided value is a Visual Builder node
 * 
 * @param       toTest      The value to test
 * @returns     `true` when the value is a Visual Builder node, `false` 
 *              otherwise
 */
export function isNode(toTest: any): toTest is CompositionNode {
  if (typeof (toTest) != 'object' || toTest == null)
    return false

  const nodeTypes = ["experience", "section", "row", "column", "component"]
  const hasValidName = (typeof (toTest as CompositionNode).name == 'string' && ((toTest as CompositionNode).name?.length ?? 0) > 0) || (toTest as CompositionNode).name == null
  const hasValidType = typeof (toTest as CompositionNode).layoutType == 'string' && nodeTypes.includes((toTest as CompositionNode).layoutType)

  return hasValidName && hasValidType
}

export const defaultPropsFactory: LeafPropsFactory = <ET extends Record<string, any>, LT = string>(node: CompositionComponentNode<ET>) => {
  const contentType = node.component?._metadata?.types
  if (!isContentType(contentType))
    throw new Error("Invalid content type: " + JSON.stringify(contentType))

  const contentLink: Partial<ContentLinkWithLocale<LT>> = {
    key: node.key || node.component?._metadata?.key || undefined,
    version: node.component?._metadata?.version,
    locale: node.component?._metadata?.locale,
    isInline: node.component?._metadata?.key ? false : true
  }
  if (!(isContentLink(contentLink) || isInlineContentLink(contentLink)))
    throw new Error("Invalid content link: " + JSON.stringify(contentLink))

  const layoutData = {
    type: node.type,
    layoutType: node.layoutType,
    template: node.template,
    settings: node.settings,
  }

  return [contentLink, contentType, node.component, layoutData]
}

export const defaultNodePropsFactory: NodePropsFactory = <ET extends Record<string, any>, LT = string>(node: CompositionStructureNode) => {
  const componentTypes = [
    // New style logic
    node.template && [node.template, ucFirst(node.type), ucFirst(node.layoutType), "Content"].filter(x => x) as string[],
    [ucFirst(node.type), ucFirst(node.layoutType), "Content"].filter(x => x) as string[],
    node.template && [node.template, ucFirst(node.layoutType), "Content"].filter(x => x) as string[],
    node.template && [node.template, "Styles", ucFirst(node.layoutType), "Content"].filter(x => x) as string[],
    node.template && [node.template, ucFirst(node.layoutType), "Nodes", "Content"].filter(x => x) as string[],

    // Old style logic
    [node.template, ucFirst(node.type), ucFirst(node.layoutType), "Component", "Content"].filter(x => x) as string[],
    (node.template && node.type) ? [node.type ? ucFirst(node.type) : null, ucFirst(node.layoutType), "Component", "Content"].filter(x => x) as string[] : null,

    // Fallback
    ["Node", "Content"],
    ["Node", "Component", "Content"]
  ].filter(x => x) as Array<Array<string>>
  const contentLink: ContentLinkWithLocale<LT> = { key: node.key ?? '', isInline: true }
  const componentData: ET = { __name: node.name } as unknown as ET
  const layoutData = {
    type: node.type,
    layoutType: node.layoutType,
    template: node.template,
    settings: node.settings
  }

  if (!(isContentLink(contentLink) || isInlineContentLink(contentLink)))
    throw new Error("🔴 [VisualBuilder] Invalid content link: " + JSON.stringify(contentLink) + " - Node: " + JSON.stringify(node))

  return [contentLink, componentTypes, componentData, layoutData]
}

export function ucFirst(input: string | undefined | null): string | null {
  if (typeof (input) == 'string' && input.length > 0)
    return input[0].toUpperCase() + input.substring(1)
  return null
}
