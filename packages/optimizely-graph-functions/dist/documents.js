"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectFragments = exports.documents = exports.DefaultFunctions = exports.queries = exports.fragments = exports.IContentDataProps = void 0;
exports.IContentDataProps = ["contentType", "id", "locale", "path", "__typename"];
exports.fragments = [
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
];
exports.queries = [
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
];
exports.DefaultFunctions = ['getContentType', 'getContentByPath', 'getContentById'];
exports.documents = [...exports.queries, ...exports.fragments];
const injectFragments = (base) => {
    const baseIsArray = Array.isArray(base);
    return baseIsArray ? [...exports.fragments, ...base] : [...exports.fragments, base];
};
exports.injectFragments = injectFragments;
//# sourceMappingURL=documents.js.map