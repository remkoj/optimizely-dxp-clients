export type CmsContentLinkDataType = IContentData | IContentInfo | LinkData | LinkItemData | string

export type IContentData<LT = string> = {
    __typename?: string | null
    _type?: string | null,
    _metadata?: IContentInfo<LT> | null
}

export type IContentInfo<LT = string> = {
    __typename?: string | null
    key?: string | null
    locale?: LT | null
    types?: Array<string | null> | null
    displayName?: string | null
    version?: string | null
    url?: LinkData | null
}

export type LinkData = {
    __typename?: "ContentUrl"
    base?: string | null
    hierarchical?: string | null
    default?: string | null
}

export type LinkItemData = {
    __typename?: "Link"
    title?: string | null
    text?: string | null
    target?: string | null
    url?: LinkData | null
}