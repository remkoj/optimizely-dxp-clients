export default [
  `fragment IContentData on _IContent
{
  _metadata {
    key
    locale
    types
    displayName
    version
    url {
      type
      base
      default
    }
  }
  _type: __typename
}`,
  `fragment IElementData on _IComponent {
  _metadata {
    key
    locale
    types
    displayName
    version
    url {
      type
      base
      default
    }
  }
  _type: __typename
}`,
  `fragment ElementData on _IComponent  {
  ...IElementData
}`,
  `fragment ComponentData on _IComponent  {
  ...IContentData
}`,
  `fragment BlockData on _IComponent  {
  ...IContentData
}`,
  `fragment PageData on _IContent {
  ...IContentData
}`,
  `fragment SectionData on _ISection {
  ...IContentData
}`,
  `fragment FormElementData on _ISection {
  ...IContentData
}`,
  `fragment LinkData on ContentUrl {
  type
  base
  default
}`,
  `fragment ReferenceData on ContentReference {
  key
  url {
    type
    base
    default
  }
}`,
  `fragment IContentInfo on IContentMetadata {
  key
  locale
  types
  displayName
  version
  url {
    type
    base
    default
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
                  ... on ICompositionComponentNode {
                    component {
                      ...BlockData
                      ...ElementData
                    }
                  }
                  ... on ICompositionStructureNode {
                    nodes {
                      # Form Field level
                      ...CompositionNodeData
                      ... on ICompositionComponentNode {
                        component {
                          ...BlockData
                          ...FormElementData
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      ... on ICompositionComponentNode {
        component {
          ...BlockData
          ...SectionData
        }
      }
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
    ...ElementData
  }
}`,
  `fragment LinkItemData on Link {
  title
  text
  target
  url {
    type
    base
    default
  }
}`
]