export default [
  `fragment _IContentData on _IContent
{
  _metadata {
    key
    locale
    types
    displayName
    version
    changeset
    variation
    url {
      type
      base
      default
    }
  }
  _type: __typename
}`,
  `fragment _IElementData on _IComponent {
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
  `fragment _LinkData on ContentUrl {
  type
  base
  default
}`,
  `fragment _ReferenceData on ContentReference {
  key
  url {
    type
    base
    default
  }
}`,
  `fragment _IContentInfo on IContentMetadata {
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
  `fragment _IContentListItem on _IContent {
  ...IContentData
}`,
  `fragment _ExperienceData on _IExperience {
  composition {
    ...CompositionNodeData
    nodes {
      ...CompositionNodeData
      ... on CompositionComponentNode {
        component {
          ...IContentData
          ...SectionElementData
        }
      }
      ... on CompositionStructureNode {
        nodes {
          ...CompositionNodeData
          ... on CompositionStructureNode {
            nodes {
              ...CompositionNodeData
              ... on CompositionStructureNode {
                nodes {
                  ...CompositionNodeData
                  ... on CompositionComponentNode {
                    component {
                      ...IContentData
                      ...BlockData
                      ...ElementData
                    }
                  }
                  ... on CompositionStructureNode {
                    nodes {
                      ...CompositionNodeData
                      ... on CompositionComponentNode {
                        component {
                          ...IContentData
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
        component {
          ...IContentData
          ...SectionData
        }
      }
    }
  }
}`,
  `fragment _SectionCompositionData on _ISection {
  composition {
    ...CompositionNodeData
    nodes {
      ...CompositionNodeData
      ... on CompositionStructureNode {
        nodes {
          ...CompositionNodeData
          ... on CompositionStructureNode {
            nodes {
              ...CompositionNodeData
              ... on CompositionComponentNode {
                component {
                  ...IContentData
                  ...BlockData
                  ...ElementData
                }
              }
              ... on CompositionStructureNode {
                nodes {
                  ...CompositionNodeData
                  ... on CompositionComponentNode {
                    component {
                      ...IContentData
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
}`,
  `fragment _CompositionStructureNode on ICompositionStructureNode {
  nodes {
    ...CompositionNodeData
    ...CompositionStructureNode
    ...CompositionComponentNode
  }
}`,
  `fragment _CompositionComponentNode on CompositionComponentNode {
  component {
    ...IContentData
    ...BlockData
    ...ElementData
    ...FormElementData
  }
}`,
  `fragment _CompositionNodeData on ICompositionNode {
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
  `fragment _LinkItemData on Link {
  title
  text
  target
  url {
    type
    base
    default
  }
}`,
`fragment _CmpImageAssetInfo on cmp_PublicImageAsset {
  __typename
  Title
  AltText
  Width
  Height
  Url
  Renditions {
    Name
    Width
    Height
    Url
  }
}`,
`fragment _CmpVideoAssetInfo on cmp_PublicVideoAsset {
  Title
  AltText
  Url
  Renditions {
    Name
    Width
    Height
    Url
  }
}`
]
