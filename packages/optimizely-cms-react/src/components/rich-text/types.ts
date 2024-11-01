import type { ComponentType as ReactComponentType } from "react";
import type { ComponentFactory, ComponentType } from "../../factory/types.js";

//#region Type defintions
export type RichTextProps = {
    /**
     * The component factory used for this rich text content
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
    as?: ComponentType

    /**
     * Control the debugging output
     */
    debug?: boolean
} & ({
    /**
     * The fieldname of this Rich Text, when it is used as part of a block
     */
    cmsFieldName?: never

    /**
     * The Element ID if this is the sole output of a Visual Builder element
     */
    cmsId?: string | null
} | {
    /**
     * The fieldname of this Rich Text, when it is used as part of a block
     */
    cmsFieldName?: string | null

    /**
     * The Element ID if this is the sole output of a Visual Builder element
     */
    cmsId?: never
})

export type RichTextComponent = ReactComponentType<RichTextProps>

export type RichTextElementProps = Readonly<{
    debug?: boolean
    factory?: ComponentFactory,
    node: Readonly<Node>,
    idPrefix: string
}>

export type Node = {}

export type TextNode = Node & {
    text: string
} & Record<string, string | number | boolean>

export type RichTextNode = Node & {
    type: "richText"
    children: Array<Node>
}
export type StringNode = Node & {
    type: "string"
    children: Array<Node>
}

export type TypedNode = NodeWithChildren<Node & {
    type: string
} & Record<string, string | number | boolean>>

export type NodeWithChildren<T extends Node> = T & {
    children?: Array<Node>
}

export type NodeInput = string | RichTextNode | StringNode