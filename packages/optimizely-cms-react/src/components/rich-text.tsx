import type { ComponentFactory, ComponentType, ComponentTypeDictionary } from "../types.js"
import { DefaultComponentFactory } from "../factory.js"
import { type FunctionComponent, type PropsWithChildren } from "react"
import { decodeHTML } from 'entities'

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
            (toTest as TextNode).text.length >= 0
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

export const RichText : FunctionComponent<RichTextProps> = ({ 
    factory, 
    text, 
    className = 'rich-text', 
    as : Wrapper = "div", 
    ...props 
}) => {
    const debug = process.env.NODE_ENV != 'production'
    const id = Utils.getRandomId("rich-text")
    const richTextFactory = factory ?? new DefaultComponentFactory(DefaultComponents)
    try {
        const data = Utils.processNodeInput(text)
        return <Wrapper className={ className } {...props}>
            { (data?.children || []).map((child, idx) => {
                const elementId = id+'::'+idx;
                return <RichTextElement key={ elementId } factory={ richTextFactory } node={ child } idPrefix={ elementId + '::' } />
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
        if (node.text.length == 0)
            return null
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
        const DivComponent = createHtmlComponent("div", false, { "data-type": node.type })
        return <DivComponent node={ node }>{ childData }</DivComponent>
    }
    const Component = factory?.resolve(`RichText/${ node.type }`) ?? 'div'
    return <Component node={ node }>{ childData }</Component>
}
//#endregion

//#region HTML Components
export function createHtmlComponent<E extends keyof JSX.IntrinsicElements>(element: E, ignoreChildren: boolean = false, defaultProps?: JSX.IntrinsicElements[E] & Record<string,string>)
{
    const HtmlElement = element as string
    const reservedProps = ['url','class','children','type']
    const component = ({ children, node, ...props }: PropsWithChildren<JSX.IntrinsicElements[E] & { node: TypedNode } >) => {
        const nodeProps : Record<string,string | number | boolean> = {}
        const renderProps = Object.getOwnPropertyNames(node) as Array<keyof TypedNode>
        renderProps.filter(x => !reservedProps.includes(x)).forEach(x => nodeProps[x] = node[x])
        if (renderProps.includes('class')) nodeProps['className'] = node['class']
        if (renderProps.includes('url')) {
            switch (node.type) {
                case 'link':
                    nodeProps['href'] = node['url']
                    break
                case 'image':
                    nodeProps['src'] = node['url']
                    break
                default:
                    nodeProps['data-url'] = node['url']
                    break
            }
        }

        return ignoreChildren ? <HtmlElement { ...defaultProps }{ ...nodeProps }{ ...props } /> : <HtmlElement { ...defaultProps }{ ...nodeProps }{ ...props }>{ children }</HtmlElement>
    }
    return component
}

const DefaultTextNode : FunctionComponent<{ node: TextNode }> = ({ node }) => {
    if (node.bold)
        return <strong>{ decodeHTML(node.text) }</strong>
    if (node.italic)
        return <em>{ decodeHTML(node.text) }</em>
    const unsupportedProps = Object.getOwnPropertyNames(node).filter(x => x != 'text')
    if (unsupportedProps.length > 0 && process.env.NODE_ENV != 'production')
        console.warn('🟠 [Rich Text] Text node with unsupported additional properties:', unsupportedProps.join(', '));
    return decodeHTML(node.text)
}

/**
 * A default component dictionary that allows to serialize the structured HTML
 * into React, using the component library shared across the react SDK.
 */
export const DefaultComponents : ComponentTypeDictionary = [
    { type: 'RichText/richText', component: createHtmlComponent("div", false, { className: "cms:rich-text" })},
    { type: 'RichText/paragraph', component: createHtmlComponent("p")},
    { type: 'RichText/span', component: createHtmlComponent("span")},
    { type: 'RichText/div', component: createHtmlComponent("div")},
    { type: 'RichText/heading-one', component: createHtmlComponent("h1")},
    { type: 'RichText/heading-two', component: createHtmlComponent("h2")},
    { type: 'RichText/heading-three', component: createHtmlComponent("h3")},
    { type: 'RichText/heading-four', component: createHtmlComponent("h4")},
    { type: 'RichText/heading-five', component: createHtmlComponent("h5")},
    { type: 'RichText/heading-six', component: createHtmlComponent("h6")},
    { type: 'RichText/link', component: createHtmlComponent("a")},
    { type: 'RichText/image', component: createHtmlComponent("img", true)},
    { type: 'RichText/text', component: DefaultTextNode},
    { type: 'RichText/br', component: createHtmlComponent("br", true)},
    { type: 'RichText/bulleted-list', component: createHtmlComponent("ul")},
    { type: 'RichText/numbered-list', component: createHtmlComponent("ol")},
    { type: 'RichText/list-item', component: createHtmlComponent("li")}
]
//#endregion

export default RichText