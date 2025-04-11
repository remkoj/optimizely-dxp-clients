export default [
  `fragment IContentData on _IContent
{
  _metadata {
    ...IContentInfo
  }
  _type: __typename
}`,
  `fragment IElementData on _IComponent {
  _metadata {
    ...IContentInfo
  }
  _type: __typename
}`,
  `fragment ElementData on _IComponent  {
  ...IElementData
}`,
  `fragment BlockData on _IComponent  {
  ...IContentData
}`,
  `fragment PageData on _IContent {
  ...IContentData
}`,
  `fragment LinkData on ContentUrl {
  base
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
    # Experience level
    ...CompositionNodeData
    nodes {
      # Section level
      ...CompositionNodeData
      ... on ICompositionStructureNode {
        nodes {
          # Row level
          ...CompositionNodeData
          ... on ICompositionStructureNode {
            nodes {
              # Column level
              ...CompositionNodeData
              ... on ICompositionStructureNode {
                nodes {
                  # Element level
                  ...CompositionNodeData
                  ...CompositionComponentNodeData
                }
              }
            }
          }
        }
      }
      ...CompositionComponentNodeData
    }
  }
}`,
  `fragment CompositionNodeData on ICompositionNode {
  name: displayName
  layoutType: nodeType
  type
  key
  template: displayTemplateKey
  settings: displaySettings {
    key
    value
  }
}`,
  `fragment CompositionComponentNodeData on ICompositionComponentNode {
  component {
    ...BlockData
    ...ElementData
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