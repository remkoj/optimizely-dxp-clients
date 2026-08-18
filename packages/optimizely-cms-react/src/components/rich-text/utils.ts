import type { TextNode, TypedNode, Node, NodeInput, RichTextNode, StringNode } from './types.js'

/**
 * Test if the provided node is a structured Rich Text text node
 * 
 * @param     toTest    The node to test
 * @returns   `true` when `toTest` is a `TextNode`
 */
export function isText(toTest: Node | null | undefined) : toTest is TextNode
{
  return (
    typeof toTest == 'object' &&
        toTest != null &&
        (typeof (toTest as TextNode).text) == 'string' &&
        (toTest as TextNode).text.length >= 0
  )
}

/**
 * Test if the provided node is a structured Rich Text node with a `type` property
 * 
 * @param     toTest    The node to test
 * @returns   `true` when `toTest` is a `TypedNode`
 */
export function isTypedNode(toTest: unknown) : toTest is TypedNode
{
  return (
    typeof toTest == 'object' &&
        toTest != null &&
        (typeof (toTest as TypedNode).type) == 'string' &&
        (toTest as TypedNode).type.length > 0
  )
}

/**
 * Test if the provided value is the root node of a structured Rich Text value
 * 
 * @param     toTest    The value to test
 * @returns   `true` when `toTest` is a `RichTextNode`
 */
export function isRichTextNode(toTest: unknown) : toTest is RichTextNode
{
  return isTypedNode(toTest) && toTest.type == 'richText'
}

/**
 * Test if the provided value is a structured Rich Text "string" root node
 * 
 * @param     toTest    The value to test
 * @returns   `true` when `toTest` is a `StringNode`
 */
export function isStringNode(toTest: unknown) : toTest is StringNode
{
  return isTypedNode(toTest) && toTest.type == 'string'
}

/**
 * Test if the provided value is a string with a length greater than zero
 * 
 * @param     toTest    The value to test
 * @returns   `true` when `toTest` is a non-empty string
 */
export function isNonEmptyString(toTest: unknown) : toTest is string
{
  return typeof(toTest) == 'string' && toTest.length > 0
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

/**
 * Test if the provided value is a valid output of the XHTML field-type within
 * Optimizely CMS
 * 
 * @param       toTest 
 * @returns 
 */
export function isNodeInput(toTest: unknown) : toTest is NodeInput
{
  return isRichTextNode(toTest) || isStringNode(toTest)
}