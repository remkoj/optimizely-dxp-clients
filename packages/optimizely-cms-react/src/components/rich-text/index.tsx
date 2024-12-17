import { type FunctionComponent } from "react";
import type { RichTextElementProps, RichTextProps } from "./types.js";
import * as Utils from './utils.js';
import { DefaultComponentFactory } from "../../factory/default.js";
import { DefaultComponents, DefaultTextNode, createHtmlComponent } from "./components.js"
import { type PropsWithContext } from "../../context/types.js"
import { CmsEditable } from "../cms-editable/index.js";

export * from "./types.js"

export const RichText : FunctionComponent<PropsWithContext<RichTextProps>> = ({ 
    factory, 
    text = "{ \"type\": \"richText\" }", 
    className = 'rich-text', 
    as : Wrapper = "div", 
    debug = false,
    noWrapper = false,
    cmsFieldName = null,
    cmsId = null,
    ctx,
    ...props 
}) => {
    const id = Utils.getRandomId("rich-text")
    const richTextFactory = factory ?? ctx.factory ?? new DefaultComponentFactory(DefaultComponents)
    const { inEditMode } = ctx
    try {
        const data = Utils.processNodeInput(text)
        const textContent = (data?.children || []).map((child, idx) => {
            const elementId = id+'::'+idx;
            return <RichTextElement key={ elementId } factory={ richTextFactory } node={ child } idPrefix={ elementId + '::' } />
        })
        
        if (noWrapper)
            return <>{ textContent }</>;

        if (inEditMode && (cmsId || cmsFieldName))
            return <CmsEditable as={ Wrapper } className={ className } cmsId={ cmsId || undefined } cmsFieldName={ cmsFieldName || undefined } ctx={ ctx } { ...props }>{ textContent }</CmsEditable>

        return <Wrapper className={ className } {...props}>{ textContent }</Wrapper>
    } catch {
        if (debug) console.warn('🟠 [Rich Text] Invalid rich text received: ', text);
        return Object.getOwnPropertyNames(props).length > 0 ? <div className={ className } {...props}></div> : null;
    }
}

//#region Supportive React components
const RichTextElement : FunctionComponent<RichTextElementProps> = ({ factory, node, idPrefix, debug }) =>
{
    // Render text
    if (Utils.isText(node)) {
        if (node.text.length == 0)
            return null
        const TextComponent = factory?.resolve(`RichText/text`) ?? DefaultTextNode
        return <TextComponent node={ node } />
    }
    
    // Ignore incorrect data
    if (!Utils.isTypedNode(node)) {
        if (debug) console.warn('🟠 [Rich Text] Invalid rich text element data received:', node)
        return null
    }

    // Process children
    const childData = node.children && (node.children.length > 0) ? node.children.map((child, idx) => {
        const elementId = idPrefix+idx;
        return <RichTextElement key={ elementId } factory={ factory } node={ child } idPrefix={ elementId + '::'} />
    }) : undefined;

    // Resolve component (and add to factory if not yet present)
    let Component = factory?.resolve(`RichText/${ node.type }`)
    if (!Component) {
        if (debug)
            console.warn(`🟠 [Rich Text] No renderer for node type, using and registering HtmlComponent for "${ node.type }": RichText/${ node.type }`)
        Component = createHtmlComponent(node.type as keyof JSX.IntrinsicElements)
        factory?.register(`RichText/${ node.type }`, Component)
    }

    // Return component
    return <Component node={ node }>{ childData && (childData.length > 0) ? childData : undefined }</Component>
}
//#endregion