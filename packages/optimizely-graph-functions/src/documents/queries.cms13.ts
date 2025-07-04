export default [
  `query getContentById($key: String!, $version: String, $locale: [Locales!], $path: String = "-", $domain: String, $changeset: String) {
      content: _Content(
        variation: { include: ALL }
        where: {
          _or: [
            { _metadata: { key: { eq: $key }, version: { eq: $version } } }
            {
              _metadata: {
                url: { default: { eq: $path }, base: { eq: $domain } }
                version: { eq: $version }
              }
            }
          ]
          _metadata: { changeset: { eq: $changeset } }
        }
        locale: $locale
      ) {
        total
        items: item {
          ...IContentData
          ...BlockData
          ...PageData
        }
      }
    }`,
  `query getContentByPath($path: [String!]!, $locale: [Locales!], $siteId: String, $changeset: String = null) {
      content: _Content(
        where: {
          _metadata: {
            url: { default: { in: $path }, base: { eq: $siteId } }
            changeset: { eq: $changeset }
          }
        }
        locale: $locale
      ) {
        total
        items: item {
          ...IContentData
          ...PageData
        }
      }
    }`,
  `query getContentType($key: String!, $version: String, $locale: [Locales!], $path: String = "-", $domain: String) {
        content: _Content(
            variation: { include: ALL }
            where: {
                _or: [
                    { _metadata: { key: { eq: $key }, version: { eq: $version } } }
                    { _metadata: { url: { hierarchical: { eq: $path }, base: { eq: $domain } }, version: { eq: $version } } }
                ]
            }
            locale: $locale
        ) {
            total
            items: item {
                _metadata {
                    types
                }
            }
        }
    }`
]