import type { CmsContentLinkDataType, IContentData, IContentInfo, LinkData, LinkItemData } from "./types.js"

export function createListKey(item: CmsContentLinkDataType) : string
{
    if (isIContentData(item))
        return iContentDataToHref(item)
    else if (isIContentInfo(item))
        return iContentInfoToHref(item)
    else if (isLinkData(item))
        return linkDataToHref(item)
    else if (IsLinkItemData(item)) {
        const link = getLinkData(item)
        return link && link.default ? link.default : (item.text ?? '-')
    } else {
        return item
    }
}

export function isIContentData(toTest: CmsContentLinkDataType | null | undefined) : toTest is IContentData
{
    // ToTest must be an Object
    if (typeof(toTest) != 'object' || toTest == null)
        return false

    // ToTest is considered IContentData if it has metadata
    return isIContentInfo((toTest as IContentData)._metadata)
}

export function isIContentInfo(toTest: CmsContentLinkDataType | null | undefined) : toTest is IContentInfo
{
    // ToTest must be an Object
    if (typeof(toTest) != 'object' || toTest == null)
        return false

    // Valid IContentInfo has a non-empty key or null value (for Inline content)
    return ((typeof((toTest as IContentInfo).key) == 'string' && ((toTest as IContentInfo).key ?? '').length > 0) || (toTest as IContentInfo).key == null)
}

export function isLinkData(toTest: CmsContentLinkDataType | null | undefined) : toTest is LinkData
{
    // ToTest must be an Object
    if (typeof(toTest) != 'object' || toTest == null)
        return false

    if (toTest.__typename == "ContentUrl")
        return true

    return typeof((toTest as LinkData).default) == 'string' || (toTest as LinkData).default == null
}

export function IsLinkItemData(toTest: CmsContentLinkDataType | null | undefined) : toTest is LinkItemData
{
    // ToTest must be an Object
    if (typeof(toTest) != 'object' || toTest == null)
        return false

    if (toTest.__typename == "Link")
        return true

    return (toTest as LinkItemData).url == null || isLinkData((toTest as LinkItemData).url)
}

export function getLinkData(item: LinkItemData) : LinkData | null
{
    const url : LinkData | null | undefined = item.url
    return url && url.default ? url : null
}

export function linkDataToUrl(item: LinkData | null | undefined) : URL | undefined
{
    try {
        return new URL(item?.default ?? '/', item?.base ?? undefined)
    } catch {
        return undefined
    }
}

export function linkToUrl(item: LinkItemData)  : URL | undefined
{
    return linkDataToUrl(getLinkData(item))
}

export function iContentDataToHref(contentData: IContentData, base?: string) : string
{
    if (!contentData._metadata)
        return '#'
    return iContentInfoToHref(contentData._metadata, base)
}

export function iContentInfoToHref(contentInfo: IContentInfo, base?: string) : string
{
    if (!contentInfo.url)
        return '#'
    return linkDataToHref(contentInfo.url, base)
}

export function linkItemDataToHref(linkItemData: LinkItemData, base?: string) : string
{
    if (!linkItemData.url)
        return '#'
    return linkDataToHref(linkItemData.url)
}

export function linkDataToHref(linkData: LinkData, base?: string) : string {
    if (base && linkData.base == base)
        return linkData.default ?? '#'
    return linkData.base ? (new URL(linkData.default ?? '/#', linkData.base)).href : linkData.default ?? '#'
}