export default [
    `query getContentById($key: String!, $version: String, $locale: [Locales!], $path: String, $domain: String) {
        content: _Content(
            where: {
                _or: [
                    { _metadata: { key: { eq: $key }, version: { eq: $version } } }
                    { _metadata: { url: { hierarchical: { eq: $path }, base: { eq: $domain } }, version: { eq: $version } } }
                ]
            }
            locale: $locale
        ) {
            total
            items {
                ...BlockData
                ...PageData
            }
        }
    }`,
    `query getContentByPath($path: [String!]!, $locale: [Locales!], $siteId: String) {
        content: _Content(
            where: {
                _metadata: { url: { default: { in: $path }, base: { eq: $siteId } }}
            }
            locale: $locale
        ) {
            total
            items {
                ...IContentData
                ...PageData
            }
        }
    }`,
    `query getContentType($key: String!, $version: String, $locale: [Locales!], $path: String, $domain: String) {
        content: _Content(
            where: {
                _or: [
                    { _metadata: { key: { eq: $key }, version: { eq: $version } } }
                    { _metadata: { url: { hierarchical: { eq: $path }, base: { eq: $domain } }, version: { eq: $version } } }
                ]
            }
            locale: $locale
        ) {
            total
            items {
                _metadata {
                    types
                }
            }
        }
    }`
]