import { type FunctionComponent } from "react";
import type { RichTextElementProps, RichTextProps } from "./types.js";
import * as Utils from './utils.js';
import { DefaultComponentFactory } from "../../factory/default.js";
import { DefaultComponents, DefaultTextNode, createHtmlComponent } from "./components.js"

export * from "./types.js"

export const RichText : FunctionComponent<RichTextProps> = ({ 
    factory, 
    text, 
    className = 'rich-text', 
    as : Wrapper = "div", 
    debug,
    ...props 
}) => {
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
const RichTextElement : FunctionComponent<RichTextElementProps> = ({ factory, node, idPrefix, debug }) =>
{
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