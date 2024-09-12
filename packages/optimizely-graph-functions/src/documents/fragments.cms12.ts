export default [
    `fragment IContentData on IContent {
        contentType: ContentType
        _metadata: ContentLink {
          ...ContentLink
        }
        locale: Language {
            name: Name
        }
        path:RelativePath
        _type: __typename
    }`,
    `fragment ContentLink on ContentModelReference {
      id: Id,
      version: WorkId,
      key: GuidValue
    }`,
    `fragment ContentLinkSearch on ContentModelReferenceSearch {
      id: Id,
      version: WorkId,
      key: GuidValue
    }`,
    `fragment ContentAreaItemData on ContentAreaItemModelSearch {
        item: ContentLink {
            ...ContentLinkSearch
            data: Expanded {
            ...BlockData
            }
        }
        displayOption:DisplayOption
    }`,
    `fragment BlockContentAreaItemSearchData on ContentAreaItemModelSearch {
        item: ContentLink {
            ...ContentLinkSearch
            data: Expanded {
            ...IContentData
            }
        }
        displayOption:DisplayOption
    }`,
    `fragment BlockContentAreaItemData on ContentAreaItemModel {
        item: ContentLink {
            ...ContentLink
            data: Expanded {
            ...IContentData
            }
        }
        displayOption:DisplayOption
    }`,
    `fragment LinkItemData on LinkItemNode {
      children: Text
      title: Title
      href: Href
      target: Target
      content: ContentLink {
        href: Url
        data: Expanded {
          path: RelativePath
        }
      }
    }`,
    `fragment ImageData on ContentModelReference {
      ...ContentLink
      url: Url
      data: Expanded {
        ...IContentData
        url: Url
        alt: Name 
        path: RelativePath
      }
    }`,
    `fragment ImageDataSearch on ContentModelReferenceSearch {
      ...ContentLinkSearch
      url: Url
      data: Expanded {
        ...IContentData
        url: Url
        alt: Name 
        path: RelativePath
      }
    }`,
    `fragment BlockData on IContent {
        ...IContentData
    }`,
    `fragment PageData on IContent {
        ...IContentData
    }`,
    `fragment ContentAreaItemBase on ContentAreaItemModelSearch {
        contentLink:ContentLink { 
            id:Id
            workId:WorkId
            guidValue:GuidValue
            component:Expanded {
                path:RelativePath
                type:ContentType
            }
        }
        displayOption:DisplayOption
    }`
]