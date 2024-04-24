import { CompositionNode, CompositionElementNode, CompositionStructureNode } from './types'

export function isElementNode(node: CompositionNode<Record<string,any>>) : node is CompositionElementNode<Record<string,any>>
{
    return node.type == "element"
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

    const nodeTypes = ["outline", "grid", "row", "column", "element"]
    const hasValidName = (typeof (toTest as CompositionNode).name == 'string' && ((toTest as CompositionNode).name?.length ?? 0) > 0) || (toTest as CompositionNode).name == null
    const hasValidType = typeof (toTest as CompositionNode).type == 'string' && nodeTypes.includes((toTest as CompositionNode).type)

    return hasValidName && hasValidType
}