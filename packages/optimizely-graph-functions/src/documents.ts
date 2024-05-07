export const IContentDataProps = ["contentType","id","locale","path","__typename"]

export const fragments = [
`fragment IContentData on IContent
{
    _metadata {
        ...IContentInfo
    }
    _type: __typename
}`,
`fragment CompositionData on ICompositionNode {
    name: displayName
    layoutType
    type
    key
    ... on ICompositionStructureNode {
        nodes @recursive(depth: 5) {
            name: displayName
        }
    }
    ... on ICompositionElementNode {
        element {
            ...ElementData
        }
    }
}`,
`fragment IElementData on IElement {
    _metadata {
        ...IContentInfo
    }
    _type: __typename
}`,
`fragment ElementData on IElement {
    ...IElementData
}`,
`fragment BlockData on IContent {
    ...IContentData
}`,
`fragment PageData on IContent {
    ...IContentData
}`,
`fragment LinkData on ContentUrl {
    base
    hierarchical
    default
}`,
`fragment ReferenceData on ContentReference {
    key
    url {
        ...LinkData
    }
}`,
`fragment IContentInfo on IContentMetadata {
    key
    locale
    types
    displayName
    version
    url {
        ...LinkData
    }
}`,
`fragment IContentListItem on IContent {
    ...IContentData
}`
]
export const queries = [
`query getContentById($key: String!, $version: String, $locale: [Locales!], $path: String, $domain: String) {
    content: Content(
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
            ...IContentData
            ...BlockData
            ...PageData
        }
    }
}`,
`query getContentByPath($path: String!, $version: String, $locale: [Locales!], $domain: String) {
    content: Content(
        where: {
            _metadata: { url: { default: { eq: $path }, base: { eq: $domain } }, version: { eq: $version }}
        }
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
`query getContentType($key: String!, $version: String, $locale: [Locales!], $path: String, $domain: String) {
    content: Content(
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

export const DefaultFunctions = ['getContentType','getContentByPath','getContentById']