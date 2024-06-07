export const IContentDataProps = ["contentType","id","locale","path","__typename"]

export const fragments = [
`fragment IContentData on _IContent
{
    _metadata {
        ...IContentInfo
    }
    _type: __typename
}`,
`fragment CompositionData on ICompositionNode {
    name: displayName
    layoutType: nodeType    
    type
    key
    template: displayTemplateKey
    settings: displaySettings {
        key
        value
    }
    ... on ICompositionStructureNode {
        nodes @recursive(depth: 10) {
            name: displayName
        }
    }
    ... on ICompositionElementNode {
        element {
            ...ElementData
        }
    }
}`,
`fragment IElementData on _IElement {
    _metadata {
        ...IContentInfo
    }
    _type: __typename
}`,
`fragment ElementData on _IElement {
    ...IElementData
}`,
`fragment BlockData on _IContent {
    ...IContentData
}`,
`fragment PageData on _IContent {
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
`fragment IContentListItem on _IContent {
    ...IContentData
}`,
`fragment ExperienceData on _IExperience {
    composition {
        ...CompositionData
    }
}`,
`fragment LinkItemData on Link {
    title
    text
    target
    url {
        ...LinkData
    }
}`
]
export const queries = [
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
`query getContentByPath($path: String!, $version: String, $locale: [Locales!], $domain: String) {
    content: _Content(
        where: {
            _metadata: { url: { default: { eq: $path }, base: { eq: $domain } }, version: { eq: $version }}
        }
        locale: $locale
    ) {
        total
        items {
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

export const DefaultFunctions = ['getContentType','getContentByPath','getContentById']