'use client'
import type { FunctionComponent, ComponentPropsWithRef, ForwardRefExoticComponent, AnchorHTMLAttributes, ReactNode, RefAttributes } from "react";
import { useMemo } from "react";
import LinkEl, { LinkProps } from 'next/link.js'
import { CmsContentLinkDataType } from './types.js'
import { IsLinkItemData, isIContentData, isIContentInfo, isLinkData, iContentDataToHref, iContentInfoToHref, linkDataToHref, linkItemDataToHref } from './helpers.js'

type LinkType = ForwardRefExoticComponent<Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & LinkProps & {
    children?: ReactNode;
} & RefAttributes<HTMLAnchorElement>>
type LinkTypeProps = ComponentPropsWithRef<LinkType>
const Link : LinkType = LinkEl as unknown as LinkType

export type CmsContentLinkProps = {
    /**
     * The Link target as retrieved from Optimizely Graph
     */
    href?: CmsContentLinkDataType | null

    /**
     * If set to a valid base URL, it will make all links targetting 
     * this base a same site link instead of an absolute link
     */
    base?: string
} & Omit<LinkTypeProps, 'href'>

/**
 * Create a Next.js Link based upon data retrieved from Optimizely Graph, using the default
 * IContentData, IContentInfo or LinkData fragments.
 * 
 * @param       param0      The component properties
 * @returns     The fully configured Next.js Link property
 */
export const CmsContentLink : FunctionComponent<CmsContentLinkProps> = ({ href, base, children, ...props }) => {
    const linkHref = useMemo(() => {
        let urlValue = '#'
        if (typeof(href) == 'string')
            urlValue = href
        else if (isIContentData(href))
            urlValue = iContentDataToHref(href, base)
        else if (isIContentInfo(href))
            urlValue = iContentInfoToHref(href, base)
        else if (isLinkData(href))
            urlValue = linkDataToHref(href, base)
        else if (IsLinkItemData(href))
            urlValue = linkItemDataToHref(href, base)
        return urlValue
    }, [ href ])
    
    return <Link href={ linkHref } { ...props }>{ children }</Link>
}