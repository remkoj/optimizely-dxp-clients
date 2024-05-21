import { type ComponentFactory } from "../../types.js"

export type RichTextProps = {
    /**
     * The component factory used for this rich text content
     */
    factory: ComponentFactory

    /**
     * The rich text to render, provided as either a HTML string or JSON encoded
     * structured data.
     */
    text: string | null | undefined

    /**
     * The value for the "data-epi-edit" marker on the top level element
     */
    editId?: string | null

    /**
     * The CSS Class to apply to the text container
     */
    className?: string
}

export type RichTextTextNode = {
    text: string
}
export type RichTextData = { 
    type: string 
    children?: Array<RichTextData | RichTextTextNode>
} 

export function isRichTextData(toTest: any) : toTest is RichTextData
{
    if (typeof(toTest) != 'object' || toTest == null)
        return false
    return typeof (toTest as RichTextData).type == 'string' && (toTest as RichTextData).type.length > 0
}

export function isRichTextText(toTest: any) : toTest is RichTextTextNode
{
    if (typeof(toTest) != 'object' || toTest == null)
        return false
    return typeof (toTest as RichTextTextNode).text == 'string' && (toTest as RichTextTextNode).text.length > 0
}

export const RichText : (props: RichTextProps) => JSX.Element = ({ factory, text, editId, className }) =>
{
    const debug = process.env.NODE_ENV != 'production'
    let data : RichTextData | undefined = undefined
    try {
        data = JSON.parse(text ?? 'undefined')
    } catch (e) { /* Ignore any error as we'll fall-back to HTML injection */}
    
    if (!data)
        return <div dangerouslySetInnerHTML={{ __html: text ?? '' }} className={ className } data-epi-edit={ editId }></div>

    if (!isRichTextData(data)) {
        if (debug) console.warn(`[Rich Text] Invalid rich text data received: ${ text }`)
        return <div className={ className } data-epi-edit={ editId }></div>
    }

    return <div className={ className } data-epi-edit={ editId }><RichTextElement factory={ factory } { ...data } /></div>
}

const RichTextElement : (props: Partial<RichTextData> & Partial<RichTextTextNode> & { factory: ComponentFactory }) => JSX.Element = ({ type, children, text, factory, ...props }) =>
{
    const debug = process.env.NODE_ENV != 'production'
    if (!type && text)
        return <>{ text }</>
    
    if (!type) {
        if (debug) console.warn(`[Rich Text] Invalid rich text element data received: ${ { type, children, text, ...props } }`)
            return <></>
    }
    const DivElement = 'div'
    const Component = factory.resolve(type) ?? DivElement
    const uid = Math.round(Math.random() * 10000)
    return <Component { ...props }>
        { children?.map(child => <RichTextElement key={ `${uid}::${ (child as RichTextData).type ?? 'text' }`} factory={ factory } {...child} />) }
    </Component>
}

export default RichText