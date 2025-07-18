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

  /**
   * The type of router within the CMS instance that has generated the link data
   * typical values are: "EXTERNAL", "SIMPLE" or "HIERARCHICAL".
   */
  type?: string | null
  /**
   * The base for the link, typically this is either null or the domain, use this
   * to ensure that there's always a full URL.
   */
  base?: string | null
  /**
   * The default path for the Link, this is either the relative path for an internal
   * link or the full path for an external link or media asset.
   */
  default?: string | null
}

export type LinkItemData = {
  __typename?: "Link"
  title?: string | null
  text?: string | null
  target?: string | null
  url?: LinkData | null
}