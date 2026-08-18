import { isContentType, isNotNullOrUndefined } from '../../utilities.js'
import { isContentLink, ContentLinkWithLocale, isInlineContentLink } from '@remkoj/optimizely-graph-client'
import type { CompositionNode, LeafPropsFactory, CompositionComponentNode, NodePropsFactory, CompositionStructureNode, CompositionComponent } from './types.js'
import type { LayoutProps } from '../cms-styles/index.js';

/**
 * Test if the Node within VisualBuilder is an Element
 * 
 * @deprecated      Visual Builder has been updated to favour components over Elements
 * @param           node        The Node to test
 * @returns         `true` if the Node is an element, `false` otherwise.
 */
export function isElementNode(node: CompositionNode): node is CompositionComponentNode {
  return isComponentNode(node)
}

/**
 * Test if the Node within VisualBuilder is a Component
 * 
 * @param           node        The Node to test
 * @returns         `true` if the Node is an element, `false` otherwise.
 */
export function isComponentNode(node: CompositionNode): node is CompositionComponentNode {
  return node.layoutType == "component"
}

/**
 * Test if the Node within VisualBuilder is a Component of a specific type
 * 
 * @param           node        The Node to test
 * @param           test        Type guard used to validate the component data
 * @returns         `true` if the Node is a component matching `test`, `false` otherwise.
 */
export function isComponentNodeOfType<ET extends Required<CompositionNode>['component']>(node: CompositionNode, test: (data: CompositionNode['component']) => data is ET): node is CompositionComponentNode<ET> {
  if (!isComponentNode(node))
    return false
  return test(node.component)
}

/**
 * Test if the Node within VisualBuilder is a structure node (e.g. experience,
 * section, row or column), as opposed to a component node.
 * 
 * @param           node        The Node to test
 * @returns         `true` if the Node is a structure node, `false` otherwise.
 */
export function isStructureNode(node: CompositionNode): node is CompositionStructureNode {
  return !isComponentNode(node)
}

/**
 * Test if the provided value is a Visual Builder node
 * 
 * @param       toTest      The value to test
 * @returns     `true` when the value is a Visual Builder node, `false` 
 *              otherwise
 */
export function isNode(toTest: unknown): toTest is CompositionNode {
  if (typeof (toTest) != 'object' || toTest == null)
    return false

  const nodeTypes = ["experience", "section", "row", "column", "component"]
  const hasValidName = (typeof (toTest as CompositionNode).name == 'string' && ((toTest as CompositionNode).name?.length ?? 0) > 0) || (toTest as CompositionNode).name == null
  const hasValidType = typeof (toTest as CompositionNode).layoutType == 'string' && nodeTypes.includes((toTest as CompositionNode).layoutType)

  return hasValidName && hasValidType
}

export const defaultPropsFactory: LeafPropsFactory = <ET extends CompositionComponent, LT = string>(node: CompositionComponentNode<ET>) => {
  const contentType = node.component?._metadata?.types
  if (!isContentType(contentType))
    throw new Error("Invalid content type: " + JSON.stringify(contentType))

  const contentLink: Partial<ContentLinkWithLocale<LT>> = {
    key: node.component?._metadata?.key || node.key || undefined,
    version: node.component?._metadata?.version,
    locale: node.component?._metadata?.locale as LT|undefined,
    isInline: node.component?._metadata?.key ? false : true
  }
  if (!(isContentLink(contentLink) || isInlineContentLink(contentLink)))
    throw new Error("Invalid content link: " + JSON.stringify(contentLink))

  const layoutData: LayoutProps = {
    type: node.type ?? 'unknown',
    layoutType: node.layoutType,
    template: node.template ?? null,
    settings: node.settings?.map(x => x ? { key: x.key, value: x.value.toString() } : undefined)?.filter(isNotNullOrUndefined) ?? [],
  }

  return [contentLink, contentType, node.key || undefined, node.component, layoutData]
}

export const defaultNodePropsFactory: NodePropsFactory = <ET extends CompositionComponent, LT = string>(node: CompositionStructureNode) => {
  const componentMainName = node.type ? ( node.layoutType === 'experience' ? node.type+"Node" : node.type) : undefined
  const componentTypes = [
    componentMainName ? [componentMainName] : undefined,
    node.template ? [ node.template ] : undefined,
    [ucFirst(node.layoutType)+'Node'],
    ['Node']
  ].filter(isNotNullOrUndefined);
  const contentLink: ContentLinkWithLocale<LT> = { key: node.key ?? '', isInline: true }
  const componentData: ET = { __name: node.name, ...node.component } as ET
  const layoutData: LayoutProps = {
    type: node.type ?? 'unknown',
    layoutType: node.layoutType,
    template: node.template ?? null,
    settings: node.settings?.map(x => x ? { key: x.key, value: x.value.toString() } : undefined)?.filter(isNotNullOrUndefined) ?? [],
  }

  if (!(isContentLink(contentLink) || isInlineContentLink(contentLink)))
    throw new Error("🔴 [VisualBuilder] Invalid content link: " + JSON.stringify(contentLink) + " - Node: " + JSON.stringify(node))

  return [contentLink, componentTypes, node.key || undefined, componentData, layoutData]
}

export function ucFirst(input: string | undefined | null): string | null {
  if (typeof (input) == 'string' && input.length > 0)
    return input[0].toUpperCase() + input.substring(1)
  return null
}
