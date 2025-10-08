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
          ...CompositionStructureNode
          ...CompositionComponentNode
        }
        component {
          ...SectionData
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
}`
]