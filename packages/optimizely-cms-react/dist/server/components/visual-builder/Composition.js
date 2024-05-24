import 'server-only';
import { isElementNode } from './functions.js';
import { CmsContent } from '../cms-content.js';
import { isContentLink, isInlineContentLink } from '@remkoj/optimizely-graph-client';
import getServerContext from '../../context.js';
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
    const layoutData = {
        type: node.type,
        layoutType: node.layoutType,
        template: node.template,
        settings: node.settings
    };
    return [contentLink, contentType, node.element, layoutData];
};
function ucFirst(input) {
    return input[0].toUpperCase() + input.substring(1);
}
const defaultNodePropsFactory = (node) => {
    const componentTypes = [
        [node.template, node.type ? ucFirst(node.type) : null, ucFirst(node.layoutType), "Component", "Content"].filter(x => x),
        (node.template && node.type) ? [node.type ? ucFirst(node.type) : null, ucFirst(node.layoutType), "Component", "Content"].filter(x => x) : null,
        ["Node", "Component", "Content"]
    ].filter(x => x);
    const contentLink = { key: node.key ?? '' };
    const componentData = {};
    const layoutData = {
        type: node.type,
        layoutType: node.layoutType,
        template: node.template,
        settings: node.settings
    };
    if (!(isContentLink(contentLink) || isInlineContentLink(contentLink)))
        throw new Error("Invalid content link: " + JSON.stringify(contentLink));
    return [contentLink, componentTypes, componentData, layoutData];
};
export async function OptimizelyComposition({ node, leafPropsFactory = defaultPropsFactory, nodePropsFactory = defaultNodePropsFactory }) {
    if (isElementNode(node)) {
        const [contentLink, contentType, fragmentData, layoutProps] = leafPropsFactory(node);
        return CmsContent({ contentLink, contentType, fragmentData, layoutProps });
    }
    const { factory, isDebug } = getServerContext();
    if (!factory)
        throw new Error("OptimizelyComposition requires the factory be defined within the serverContext");
    const children = await Promise.all((node.nodes ?? []).map((child, idx) => {
        const childKey = `vb::node::${child.key}::${child.name}`;
        return OptimizelyComposition({
            key: childKey,
            node: child,
            leafPropsFactory,
            nodePropsFactory
        });
    }));
    const [contentLink, contentTypes, fragmentData, layoutProps] = nodePropsFactory(node);
    const firstExistingType = contentTypes.map(ct => {
        const reversed = [...ct].reverse();
        const hasType = factory.has(reversed);
        if (!hasType && isDebug)
            console.log(`🟡 [VisualBuilder] Content type ${reversed.join('/')} not found within factory`);
        return hasType;
    }).indexOf(true);
    const contentType = contentTypes[firstExistingType];
    if (!contentType)
        throw new Error("OptimizelyComposition requires the factory have a definition for Component/Node");
    return CmsContent({
        contentType,
        contentLink,
        fragmentData,
        children,
        layoutProps
    });
}
export default OptimizelyComposition;
//# sourceMappingURL=Composition.js.map