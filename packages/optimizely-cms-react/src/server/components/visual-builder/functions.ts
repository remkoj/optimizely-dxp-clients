import type { ContentType } from '../../../types.js'
import { isContentLink, ContentLinkWithLocale, isInlineContentLink } from '@remkoj/optimizely-graph-client'
import type { CompositionNode, LeafPropsFactory, CompositionElementNode, NodePropsFactory, CompositionStructureNode } from './types.js'

export function isElementNode(node: CompositionNode<Record<string,any>>) : node is CompositionElementNode<Record<string,any>>
{
    return node.layoutType == "element"
}

export function isElementNodeOfType<ET extends Record<string,any>>(node: CompositionNode<Record<string,any>>, test: (data: Record<string,any>) => data is ET) : node is CompositionElementNode<ET>
{
    if (!isElementNode(node))
        return false
    return test(node.element)
}

export function isStructureNode(node: CompositionNode<Record<string,any>>) : node is CompositionStructureNode
{
    return !isElementNode(node)
}

export function isNode(toTest: any) : toTest is CompositionNode
{
    if (typeof(toTest) != 'object' || toTest == null)
        return false

    const nodeTypes = ["experience", "outline", "grid", "row", "column", "element"]
    const hasValidName = (typeof (toTest as CompositionNode).name == 'string' && ((toTest as CompositionNode).name?.length ?? 0) > 0) || (toTest as CompositionNode).name == null
    const hasValidType = typeof (toTest as CompositionNode).layoutType == 'string' && nodeTypes.includes((toTest as CompositionNode).layoutType)

    return hasValidName && hasValidType
}

export function isContentType(toTest: any) : toTest is ContentType
{
    return Array.isArray(toTest) && toTest.every(x => typeof(x) == 'string' && x.length > 0)
}

export const defaultPropsFactory : LeafPropsFactory = <ET extends Record<string, any>, LT = string>(node: CompositionElementNode<ET>) => {
    const contentType = node.element?._metadata?.types
    if (!isContentType(contentType))
        throw new Error("Invalid content type: "+JSON.stringify(contentType))

    const contentLink : Partial<ContentLinkWithLocale<LT>> = {
        key: node.element?._metadata?.key || node.key || undefined,
        version: node.element?._metadata?.version,
        locale: node.element?._metadata?.locale
    }
    if (!(isContentLink(contentLink) || isInlineContentLink(contentLink)))
        throw new Error("Invalid content link: "+JSON.stringify(contentLink))

    const layoutData = {
        type: node.type,
        layoutType: node.layoutType,
        template: node.template,
        settings: node.settings
    }

    return [ contentLink, contentType, node.element, layoutData ]
}

export const defaultNodePropsFactory : NodePropsFactory = <ET extends Record<string, any>, LT = string>(node: CompositionStructureNode) => {
    const componentTypes = [
        [ node.template, ucFirst(node.type), ucFirst(node.layoutType), "Component", "Content"].filter(x => x) as string[],
        (node.template && node.type) ? [ node.type ? ucFirst(node.type) : null, ucFirst(node.layoutType), "Component", "Content"].filter(x => x) as string[] : null,
        ["Node","Component","Content"]
    ].filter(x => x) as Array<Array<string>>
    const contentLink : ContentLinkWithLocale<LT> = { key: node.key ?? '' }
    const componentData : ET = {} as ET
    const layoutData = {
        type: node.type,
        layoutType: node.layoutType,
        template: node.template,
        settings: node.settings
    }

    if (!(isContentLink(contentLink) || isInlineContentLink(contentLink)))
        throw new Error("🔴 [VisualBuilder] Invalid content link: "+JSON.stringify(contentLink) +" - Node: "+ JSON.stringify(node))

    return [ contentLink, componentTypes, componentData, layoutData ]
}

export function ucFirst(input: string | undefined | null): string | null
{
    if (typeof(input) == 'string' && input.length > 0)
        return input[0].toUpperCase() + input.substring(1)
    return null
}