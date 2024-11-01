import { type FunctionComponent, type PropsWithChildren } from "react";
import { ComponentTypeDictionary } from "../../factory/types.js";
import type { TextNode, TypedNode } from "./types.js";
import { decodeHTML } from 'entities';

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

export const DefaultTextNode : FunctionComponent<{ node: TextNode }> = ({ node }) => {
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