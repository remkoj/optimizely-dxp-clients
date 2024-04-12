import type { Types } from '@graphql-codegen/plugin-helpers'

type DocumentsConfigNode = NonNullable<Types.Config['documents']>

export const IContentDataProps = ["contentType","id","locale","path","__typename"]

export const fragments = [
`fragment IContentData on IContent
{
    _metadata {
        key
        locale
        types
        displayName
        version
    }
    _type: __typename
}`,
`fragment BlockData on IContent {
    ...IContentData
}`,
`fragment PageData on IContent {
    ...IContentData
}`
  /*
    `fragment ContentLink on ContentModelReference {
      id: Id,
      workId: WorkId,
      guidValue: GuidValue
    }`,
    `fragment ContentLinkSearch on ContentModelReferenceSearch {
      id: Id,
      workId: WorkId,
      guidValue: GuidValue
    }`,
    `fragment IContentData on IContent {
        contentType: ContentType
        id: ContentLink {
          ...ContentLink
        }
        locale: Language {
            name: Name
        }
        path:RelativePath
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
    }`*/
]
export const queries = [
`query getContentById($id: String!, $locale: [Locales]) {
    content: Content(where: { _metadata: { key: { eq: $id } } }, locale: $locale) {
        total
        items {
            ...IContentData
            ...BlockData
            ...PageData
        }
    }
}`,
`query getContentByPath($path: String!, $domain: String, $locale: [Locales]) {
    content: Content(
        where: { _metadata: { url: { hierarchical: { eq: $path }, base: { eq: $domain } } } }
        locale: $locale
    ) {
        total
        items {
            ...IContentData
            ...BlockData
            ...PageData
        }
    }
}`,
`query getContentType($id: String!, $locale: [Locales]) {
    content: Content(where: { _metadata: { key: { eq: $id } } }, locale: $locale) {
        total
        items {
            _metadata {
                types
            }
        }
    }
}`
]

export const DefaultFunctions = ['getContentType','getContentByPath','getContentById']
export const documents = [ ...queries, ...fragments ]
export const injectFragments : (base: DocumentsConfigNode) => DocumentsConfigNode = (base) =>
{
    const baseIsArray = Array.isArray(base)
    return baseIsArray ? [ ...fragments, ...base ] : [ ...fragments, base ]
}