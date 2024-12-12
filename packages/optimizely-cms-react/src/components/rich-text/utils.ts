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

export function isRichTextNode(toTest: any) : toTest is RichTextNode
{
    return isTypedNode(toTest) && toTest.type == 'richText'
}

export function isStringNode(toTest: any) : toTest is StringNode
{
    return isTypedNode(toTest) && toTest.type == 'string'
}

/**
 * Test if the provided value is a valid output of the XHTML field-type within
 * Optimizely CMS
 * 
 * @param       toTest 
 * @returns 
 */
export function isNodeInput(toTest: any) : toTest is NodeInput
{
    return isRichTextNode(toTest) || isStringNode(toTest)
}