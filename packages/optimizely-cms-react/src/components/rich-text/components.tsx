import { type FunctionComponent, type PropsWithChildren } from 'react'
import { ComponentTypeDictionary } from '../../factory/types.js'
import type { TextNode, TypedNode } from './types.js'
import { type PropsWithOptionalContext } from '../../context/types.js'
import { decodeHTML } from 'entities'

// Global constants
const reservedProps = ['url', 'class', 'children', 'type', 'internal', 'base']

//#region HTML Components
/**
 * Create a React Component to render an element within a Rich-Text area.
 * The generated React Component contains the logic to transform the attributes
 * provided by the Rich Text structured data to the appropriate React
 * attributes for rendering.
 *
 * @param element           The HTML element
 * @param ignoreChildren    If set to `true`, it will output a self-closing
 *                          element and fully ignoring the children
 * @param defaultProps      Override the default attributes that should always
 *                          be applied, the CSS Classess (defined by the
 *                          `className` property) will be merged
 *
 * @returns     The React Component
 */
export function createHtmlComponent<E extends keyof JSX.IntrinsicElements>(
  element: E,
  ignoreChildren: boolean = false,
  defaultProps?: JSX.IntrinsicElements[E] & Record<string, string>
) {
  const HtmlElement = element as string
  const component = ({
    children,
    node,
    ctx,
    ...props
  }: PropsWithOptionalContext<
    PropsWithChildren<JSX.IntrinsicElements[E] & { node: TypedNode }>
  >) => {
    const nodeProps: Record<string, string | number | boolean> = {}
    const renderProps = Object.getOwnPropertyNames(node) as Array<
      keyof TypedNode
    >

    // Copy over non-reserved Props
    renderProps
      .filter((x) => !reservedProps.includes(x))
      .forEach((x) => (nodeProps[x] = node[x]))

    // Move CSS Class definition into React property name
    if (renderProps.includes('class')) nodeProps['className'] = node['class']

    // Handle URLs
    if (renderProps.includes('url')) {
      switch (node.type) {
        case 'link':
          nodeProps['href'] = node['url']
          break
        case 'video':
        case 'image':
          nodeProps['src'] = node['url']
          break
        default:
          nodeProps['data-url'] = node['url']
          break
      }
    }

    // Render element
    return ignoreChildren ? (
      <HtmlElement {...defaultProps} {...nodeProps} {...props} />
    ) : (
      <HtmlElement {...defaultProps} {...nodeProps} {...props}>
        {children}
      </HtmlElement>
    )
  }
  return component
}

export const DefaultTextNode: FunctionComponent<
  PropsWithOptionalContext<{ node: TextNode }>
> = ({ ctx, node }) => {
  if (node.bold) return <strong>{decodeHTML(node.text)}</strong>
  if (node.italic) return <em>{decodeHTML(node.text)}</em>
  const unsupportedProps = Object.getOwnPropertyNames(node).filter(
    (x) => x != 'text'
  )
  if (unsupportedProps.length > 0 && ctx?.isDebugOrDevelopment)
    console.warn(
      '🟠 [Rich Text] Text node with unsupported additional properties:',
      unsupportedProps.join(', ')
    )
  return decodeHTML(node.text)
}

/**
 * A default component dictionary that allows to serialize the structured HTML
 * into React, using the component library shared across the react SDK.
 */
export const DefaultComponents: ComponentTypeDictionary = [
  // System types
  {
    type: 'RichText/richText',
    component: createHtmlComponent('div', false, {
      className: 'cms:rich-text',
    }),
  },
  { type: 'RichText/text', component: DefaultTextNode },

  // Aliased tags
  { type: 'RichText/paragraph', component: createHtmlComponent('p') },
  { type: 'RichText/heading-one', component: createHtmlComponent('h1') },
  { type: 'RichText/heading-two', component: createHtmlComponent('h2') },
  { type: 'RichText/heading-three', component: createHtmlComponent('h3') },
  { type: 'RichText/heading-four', component: createHtmlComponent('h4') },
  { type: 'RichText/heading-five', component: createHtmlComponent('h5') },
  { type: 'RichText/heading-six', component: createHtmlComponent('h6') },
  { type: 'RichText/link', component: createHtmlComponent('a') },
  { type: 'RichText/bulleted-list', component: createHtmlComponent('ul') },
  { type: 'RichText/numbered-list', component: createHtmlComponent('ol') },
  { type: 'RichText/list-item', component: createHtmlComponent('li') },
  { type: 'RichText/image', component: createHtmlComponent('img', true) },

  // Self-closing tags
  { type: 'RichText/br', component: createHtmlComponent('br', true) },
]
//#endregion
