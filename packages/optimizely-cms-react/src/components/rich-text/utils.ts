import type { TextNode, TypedNode, Node, NodeInput, RichTextNode, StringNode } from './types.js'

export function isText(toTest: Node | null | undefined) : toTest is TextNode
{
    return (
        typeof toTest == 'object' &&
        toTest != null &&
        (typeof (toTest as TextNode).text) == 'string' &&
        (toTest as TextNode).text.length >= 0
    )
}

export function isTypedNode(toTest: Node | null | undefined) : toTest is TypedNode
{
    return (
        typeof toTest == 'object' &&
        toTest != null &&
        (typeof (toTest as TypedNode).type) == 'string' &&
        (toTest as TypedNode).type.length > 0
    )
}

export function processNodeInput(input: NodeInput | null | undefined) : RichTextNode | StringNode | undefined
{
    if (!input)
        return undefined
    const textObject = typeof input == "string" ? JSON.parse(input) as RichTextNode | StringNode : input
    if (textObject?.type != "richText" && textObject?.type != "string")
        throw new Error('Structured rich text requires a "richText" root node')
    return textObject
}

export function getRandomId(scope: string = "richText") : string
{
    return `${scope}::${ Math.round(Math.random() * 100000) }`
}