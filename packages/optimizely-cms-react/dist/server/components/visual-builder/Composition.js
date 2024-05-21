import { jsx as _jsx } from "react/jsx-runtime";
import 'server-only';
import { isElementNode } from './functions.js';
import { CmsContent } from '../cms-content.js';
import { getRandomKey } from '../../../utilities.js';
import { isContentLink, isInlineContentLink } from '@remkoj/optimizely-graph-client';
function isContentType(toTest) {
    return Array.isArray(toTest) && toTest.every(x => typeof (x) == 'string' && x.length > 0);
}
const defaultPropsFactory = (node) => {
    const contentType = node.element?._metadata?.types;
    if (!isContentType(contentType))
        throw new Error("Invalid content type: " + JSON.stringify(contentType));
    const contentLink = {
        key: node.element?._metadata?.key || node.key || undefined,
        version: node.element?._metadata?.version,
        locale: node.element?._metadata?.locale
    };
    if (!(isContentLink(contentLink) || isInlineContentLink(contentLink)))
        throw new Error("Invalid content link: " + JSON.stringify(contentLink));
    return [contentLink, contentType, node.element];
};
export async function OptimizelyComposition({ node, elementFactory, propsFactory = defaultPropsFactory }) {
    if (isElementNode(node)) {
        const [contentLink, contentType, fragmentData] = propsFactory(node);
        return CmsContent({ contentLink, contentType, fragmentData });
    }
    const children = await Promise.all((node.nodes ?? []).map((child, idx) => {
        const childKey = `vb::node::${child.key}::${Math.round(Math.random() * 10000)}` ?? getRandomKey(child.name ?? 'vb::node');
        //console.log("Visual builder child: ", childKey)
        return OptimizelyComposition({
            key: childKey,
            node: child,
            elementFactory,
            propsFactory
        });
    }));
    const Element = elementFactory(node);
    return _jsx(Element, { node: { name: node.name, layoutType: node.layoutType, type: node.type, key: node.key }, children: children });
}
export default OptimizelyComposition;
//# sourceMappingURL=Composition.js.map