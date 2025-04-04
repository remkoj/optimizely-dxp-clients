import type { ComponentType as ReactComponentType } from "react";
import type { ComponentFactory } from "../../factory/types.js";
import type { PropsWithOptionalContext } from "../../context/types.js";
import type { ElementType } from "../type-utils.js";

//#region Type defintions
export type RichTextProps = {
  /**
   * The component factory used for this rich text content
   * 
   * @deprecated  The factory from the context will be used
   */
  factory?: ComponentFactory

  /**
   * The rich text to render, provided as either a HTML string or JSON encoded
   * structured data.
   */
  text: NodeInput | null | undefined

  /**
   * The CSS Class to apply to the text container
   */
  className?: string

  /**
   * Set the component type of the wrapper to use, defaults to a 'div' 
   * element when not defined
   */
  as?: ElementType

  /**
   * Control the debugging output
   */
  debug?: boolean

  /**
   * If set to true, the output will be wrapped in a Fragment and no properties
   * will be set on the Fragment to prevent React errors.
   */
  noWrapper?: boolean

  /**
   * The fieldname of this Rich Text, when it is used as part of a block
   */
  cmsFieldName?: string | null

  /**
   * The Element ID if this is the sole output of a Visual Builder element
   */
  cmsId?: string | null
}

export type RichTextComponent = ReactComponentType<PropsWithOptionalContext<RichTextProps>>

export type RichTextElementProps = Readonly<{
  debug?: boolean
  factory?: ComponentFactory,
  node: Readonly<Node>,
  idPrefix: string
}>

export type Node = {}

/**
 * Structured HTML node type for text data
 */
export type TextNode = Node & {
  text: string
} & Record<string, string | number | boolean>

/**
 * Structured HTML root node
 */
export type RichTextNode = Node & {
  type: "richText"
  children: Array<Node>
}

/**
 * Structured HTML node for structured
 * text
 */
export type StringNode = Node & {
  type: "string"
  children: Array<Node>
}

/**
 * Structured HTML node type with a specific
 * type defined
 */
export type TypedNode = NodeWithChildren<Node & {
  type: string
} & Record<string, string | number | boolean>>

export type NodeWithChildren<T extends Node> = T & {
  children?: Array<Node>
}

/**
 * Allowable data type to provide to the RichText
 * component
 */
export type NodeInput = string | RichTextNode | StringNode