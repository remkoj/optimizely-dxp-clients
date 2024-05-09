import 'server-only'
import { isElementNode } from './functions'
import { CmsContent } from '../cms-content'
import type { ContentType } from '../../../types'
import { getRandomKey } from '../../../utilities'
import { isContentLink, ContentLinkWithLocale, isInlineContentLink } from '@remkoj/optimizely-graph-client'
import type { OptimizelyCompositionProps, CmsComponentPropsFactory, CompositionElementNode } from './types'

function isContentType(toTest: any) : toTest is ContentType
{
    return Array.isArray(toTest) && toTest.every(x => typeof(x) == 'string' && x.length > 0)
}

const defaultPropsFactory : CmsComponentPropsFactory = <ET extends Record<string, any>, LT = string>(node: CompositionElementNode<ET>) => {
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
    return [ contentLink, contentType, node.element ]
}

export async function OptimizelyComposition({ node, elementFactory, propsFactory = defaultPropsFactory }: OptimizelyCompositionProps) : Promise<JSX.Element>
{
    if (isElementNode(node)) {
        const [ contentLink, contentType, fragmentData ] = propsFactory(node)
        return CmsContent({contentLink, contentType, fragmentData })
    }

    const children = await Promise.all((node.nodes ?? []).map((child, idx) => {
        const childKey = `vb::node::${child.key}::${ Math.round(Math.random()*10000) }` ?? getRandomKey(child.name ?? 'vb::node')
        //console.log("Visual builder child: ", childKey)
        return OptimizelyComposition({
            key: childKey,
            node: child,
            elementFactory,
            propsFactory
        })
    }));
    const Element = elementFactory(node)
    return <Element node={{ name: node.name, layoutType: node.layoutType, type: node.type, key: node.key }}>{ children }</Element>
}

export default OptimizelyComposition