import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
export function isRichTextData(toTest) {
    if (typeof (toTest) != 'object' || toTest == null)
        return false;
    return typeof toTest.type == 'string' && toTest.type.length > 0;
}
export function isRichTextText(toTest) {
    if (typeof (toTest) != 'object' || toTest == null)
        return false;
    return typeof toTest.text == 'string' && toTest.text.length > 0;
}
export const RichText = ({ factory, text }) => {
    const debug = process.env.NODE_ENV != 'production';
    let data = undefined;
    try {
        data = JSON.parse(text ?? 'undefined');
    }
    catch (e) { /* Ignore any error as we'll fall-back to HTML injection */ }
    if (!data)
        return _jsx("div", { dangerouslySetInnerHTML: { __html: text ?? '' } });
    if (!isRichTextData(data)) {
        if (debug)
            console.warn(`[Rich Text] Invalid rich text data received: ${text}`);
        return _jsx(_Fragment, {});
    }
    return _jsx(RichTextElement, { factory: factory, ...data });
};
const RichTextElement = ({ type, children, text, factory, ...props }) => {
    const debug = process.env.NODE_ENV != 'production';
    if (!type && text)
        return _jsx(_Fragment, { children: text });
    if (!type) {
        if (debug)
            console.warn(`[Rich Text] Invalid rich text element data received: ${{ type, children, text, ...props }}`);
        return _jsx(_Fragment, {});
    }
    const DivElement = 'div';
    const Component = factory.resolve(type) ?? DivElement;
    const uid = Math.round(Math.random() * 10000);
    return _jsx(Component, { ...props, children: children?.map(child => _jsx(RichTextElement, { factory: factory, ...child }, `${uid}::${child.type ?? 'text'}`)) });
};
export default RichText;
//# sourceMappingURL=index.js.map