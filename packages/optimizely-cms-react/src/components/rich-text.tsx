import { type ComponentFactory, type ComponentType, type ComponentTypeDictionary } from "@remkoj/optimizely-cms-react"
import { type FunctionComponent, type PropsWithChildren } from "react"

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

type RichTextElementProps = Readonly<{
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

//#endregion

//#region Utils & Supports
export const Utils = {
    isText(toTest: Node | null | undefined) : toTest is TextNode
    {
        return (
            typeof toTest == 'object' &&
            toTest != null &&
            (typeof (toTest as TextNode).text) == 'string' &&
            (toTest as TextNode).text.length > 0
        )
    },

    isTypedNode(toTest: Node | null | undefined) : toTest is TypedNode
    {
        return (
            typeof toTest == 'object' &&
            toTest != null &&
            (typeof (toTest as TypedNode).type) == 'string' &&
            (toTest as TypedNode).type.length > 0
        )
    },

    processNodeInput(input: NodeInput | null | undefined) : RichTextNode | StringNode | undefined
    {
        if (!input)
            return undefined
        const textObject = typeof input == "string" ? JSON.parse(input) as RichTextNode | StringNode : input
        if (textObject?.type != "richText" && textObject?.type != "string")
            throw new Error('Structured rich text requires a "richText" root node')
        return textObject
    },

    getRandomId(scope: string = "richText") : string
    {
        return `${scope}::${ Math.round(Math.random() * 100000) }`
    }
}

//#endregion

export const RichText : FunctionComponent<RichTextProps> = ({ factory, text, className = 'rich-text', as : Wrapper = "div", ...props }) =>
{
    const debug = process.env.NODE_ENV != 'production'
    const id = Utils.getRandomId("rich-text")
    try {
        const data = Utils.processNodeInput(text)
        return <Wrapper className={ className } {...props}>
            { (data?.children || []).map((child, idx) => {
                const elementId = id+'::'+idx;
                return <RichTextElement key={ elementId } factory={ factory } node={ child } idPrefix={ elementId + '::' } />
            })}
        </Wrapper>
    } catch {
        if (debug) console.warn('🟠 [Rich Text] Invalid rich text received: ', text);
        return Object.getOwnPropertyNames(props).length > 0 ? <div className={ className } {...props}></div> : null;
    }
}

//#region Supportive React components
const RichTextElement : FunctionComponent<RichTextElementProps> = ({ factory, node, idPrefix }) =>
{
    const debug = process.env.NODE_ENV != 'production'
    if (Utils.isText(node)) {
        const TextComponent = factory?.resolve(`RichText/text`) ?? DefaultTextNode
        return <TextComponent node={ node } />
    }
    
    if (!Utils.isTypedNode(node)) {
        if (debug) console.warn('🟠 [Rich Text] Invalid rich text element data received:', node)
        return null
    }

    const childData = node.children?.map((child, idx) => {
        const elementId = idPrefix+idx;
        return <RichTextElement key={ elementId } factory={ factory } node={ child } idPrefix={ elementId + '::'} />
    })
    if (!factory?.has(`RichText/${ node.type }`)) {
        console.warn('🟠 [Rich Text] No renderer for node type, falling back to "div":', `RichText/${ node.type }`)
        return <div>{ childData }</div>
    }
    const Component = factory?.resolve(`RichText/${ node.type }`) ?? 'div'
    return <Component node={ node }>{ childData }</Component>
}

const DefaultTextNode : FunctionComponent<{ node: TextNode }> = ({ node }) => {
    if (node.bold)
        return <strong>{ node.text }</strong>
    const unsupportedProps = Object.getOwnPropertyNames(node).filter(x => x != 'text')
    if (unsupportedProps.length > 0 && process.env.NODE_ENV != 'production')
        console.warn('🟠 [Rich Text] Text node with unsupported additional properties:', unsupportedProps.join(', '));
    return node.text?.replaceAll("&nbsp;", " ")
}
//#endregion

/**
 * A default component dictionary that allows to serialize the structured HTML
 * into React, using the component library shared across the react SDK.
 */
export const DefaultComponents : ComponentTypeDictionary = [
    { type: 'RichText/paragraph', component: ({ children, node, ...props }: PropsWithChildren<JSX.IntrinsicElements["p"] & { node: Node }>) => { return <p { ...props }>{ children }</p>} },
    { type: 'RichText/text', component: DefaultTextNode}
]

export default RichText