export default [
  `query getContentById($id: Int, $workId: Int, $guidValue: String, $locale: [Locales!], $isCommonDraft: Boolean) {
        content: Content(
            where: {
                ContentLink: { 
                    Id: { eq: $id }, 
                    WorkId: { eq: $workId }, 
                    GuidValue: { eq: $guidValue } 
                }
                IsCommonDraft: { eq: $isCommonDraft }
            }
            locale: $locale
        ) {
            total
            item: items {
                ...IContentData
                ...PageData
                ...BlockData
            }
        }
    }`,
  `query getContentByPath($path: [String!]!, $locale: [Locales], $siteId: String) {
        content: Content(
            where: {
                RelativePath: {
                    in: $path
                }
                SiteId: {
                    eq: $siteId
                }
            },
            locale: $locale
        ) {
            items: item {
                ...IContentData
                ...PageData
            }
        }
    }`,
  `query getContentType($id: Int, $workId: Int, $guidValue: String, $locale: [Locales]) {
        content: Content(
            where: {
                ContentLink: {
                    GuidValue: {
                        eq: $guidValue
                    }
                    Id: {
                        eq: $id
                    },
                    WorkId: {
                        eq: $workId
                    }
                }
            },
            locale: $locale
            limit: 1
        ) {
            item: items {
                ContentType
            },
            total
        }
    }`
]