import type { FunctionComponent } from "react";
import type { LinkItemData } from './types.js'
import { CmsContentLink, type CmsContentLinkProps } from "./CmsContentLink.js";

export type CmsLinkProps = {
    href: LinkItemData
} & Omit<CmsContentLinkProps, 'href' | 'children' | 'title' | 'target'>

export const CmsLink : FunctionComponent<CmsLinkProps> = ({ href, ...props }) =>
{
    const linkText = href.text ?? ""
    const linkTitle = href.title ?? undefined
    const linkTarget = href.target ?? undefined
    return <CmsContentLink href={ href } title={ linkTitle } target={ linkTarget } { ...props } >{ linkText }</CmsContentLink>
}

export default CmsLink