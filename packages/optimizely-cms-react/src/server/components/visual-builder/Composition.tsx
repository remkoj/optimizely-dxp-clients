import 'server-only'
import { isElementNode } from './functions.js'
import { CmsContent } from '../cms-content.js'
import type { ContentType } from '../../../types.js'
import { getRandomKey } from '../../../utilities.js'
import { isContentLink, ContentLinkWithLocale, isInlineContentLink } from '@remkoj/optimizely-graph-client'
import type { OptimizelyCompositionProps, LeafPropsFactory, CompositionElementNode, NodePropsFactory, CompositionStructureNode } from './types.js'
import getServerContext from '../../context.js'

function isContentType(toTest: any) : toTest is ContentType
{
    return Array.isArray(toTest) && toTest.every(x => typeof(x) == 'string' && x.length > 0)
}

const defaultPropsFactory : LeafPropsFactory = <ET extends Record<string, any>, LT = string>(node: CompositionElementNode<ET>) => {
    const contentType = node.element?._metadata?.types
    if (!isContentType(contentType))
        throw new Error("Invalid content type: "+JSON.stringify(contentType))

    const contentLink : Partial<ContentLinkWithLocale<LT>> = {
        key: node.element?._metadata?.key || node.key || undefined,
        version: node.element?._metadata?.version,
        locale: node.element?._metadata?.locale
    }
    if (!(isContentLink(contentLink) || isInlineContentLink(contentLink)))
        throw new Error("Invalid content link: "+JSON.stringify(contentLink))

    const layoutData = {
        type: node.type,
        layoutType: node.layoutType,
        template: node.template,
        settings: node.settings
    }

    return [ contentLink, contentType, node.element, layoutData ]
}

function ucFirst(input: string): string
{
    return input[0].toUpperCase() + input.substring(1)
}

const defaultNodePropsFactory : NodePropsFactory = <ET extends Record<string, any>, LT = string>(node: CompositionStructureNode) => {
    const componentTypes = [
        [ node.template, node.type ? ucFirst(node.type) : null, ucFirst(node.layoutType), "Component", "Content"].filter(x => x) as string[],
        (node.template && node.type) ? [ node.type ? ucFirst(node.type) : null, ucFirst(node.layoutType), "Component", "Content"].filter(x => x) as string[] : null,
        ["Node","Component","Content"]
    ].filter(x => x) as Array<Array<string>>
    const contentLink : ContentLinkWithLocale<LT> = { key: node.key ?? '' }
    const componentData : ET = {} as ET
    const layoutData = {
        type: node.type,
        layoutType: node.layoutType,
        template: node.template,
        settings: node.settings
    }

    if (!(isContentLink(contentLink) || isInlineContentLink(contentLink)))
        throw new Error("Invalid content link: "+JSON.stringify(contentLink))

    return [ contentLink, componentTypes, componentData, layoutData ]
}

export async function OptimizelyComposition({ node, leafPropsFactory = defaultPropsFactory, nodePropsFactory = defaultNodePropsFactory}: OptimizelyCompositionProps) : Promise<JSX.Element>
{
    if (isElementNode(node)) {
        const [ contentLink, contentType, fragmentData, layoutProps ] = leafPropsFactory(node)
        return CmsContent({contentLink, contentType, fragmentData, layoutProps })
    }

    const { factory, isDebug } = getServerContext()
    if (!factory)
        throw new Error("OptimizelyComposition requires the factory be defined within the serverContext")

    const children = await Promise.all((node.nodes ?? []).map((child, idx) => {
        const childKey = `vb::node::${child.key}::${child.name}`
        return OptimizelyComposition({
            key: childKey,
            node: child,
            leafPropsFactory,
            nodePropsFactory
        })
    }));

    const [ contentLink, contentTypes, fragmentData, layoutProps ] = nodePropsFactory(node)
    const firstExistingType = contentTypes.map(ct => {
        const reversed = [...ct].reverse()
        const hasType = factory.has(reversed)
        if (!hasType && isDebug)
            console.log(`🟡 [VisualBuilder] Content type ${ reversed.join('/') } not found within factory`)
        return hasType
    }).indexOf(true)
    const contentType = contentTypes[firstExistingType]
    if (!contentType)
        throw new Error("OptimizelyComposition requires the factory have a definition for Component/Node")

    return CmsContent({
        contentType,
        contentLink,
        fragmentData,
        children,
        layoutProps
    })
}

export default OptimizelyComposition