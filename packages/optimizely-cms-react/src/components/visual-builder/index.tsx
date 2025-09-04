import { ReactNode } from 'react'
import {
  isComponentNode,
  defaultNodePropsFactory,
  defaultPropsFactory,
} from './functions.js'
import type { BaseOptimizelyCompositionProps } from './types.js'
export type * from './types.js'

/**
 * Render the composition as made available through Optimizely Graph for Visual Builder
 *
 * @param param0
 * @returns     The
 */
export function OptimizelyComposition({
  node,
  leafPropsFactory = defaultPropsFactory,
  nodePropsFactory = defaultNodePropsFactory,
  ctx,
  cmsContent: CmsContent,
}: BaseOptimizelyCompositionProps): ReactNode {
  const { factory, isDebug } = ctx

  // Render the element
  if (isComponentNode(node)) {
    if (isDebug)
      console.log(
        `⚪ [VisualBuilder] Rendering element node ${JSON.stringify(node)}`
      )
    const [contentLink, contentType, nodeId, fragmentData, layoutProps] =
      leafPropsFactory(node)
    return (
      <CmsContent
        contentLink={contentLink}
        contentType={contentType}
        fragmentData={fragmentData}
        layoutProps={layoutProps}
        editorComponentId={nodeId || contentLink.key || undefined}
        ctx={ctx}
      />
    )
  }

  // Debug
  if (isDebug)
    console.log(
      `⚪ [VisualBuilder] Rendering structure node ${JSON.stringify(node)}`
    )

  // Ensure we've got a factory
  if (!factory)
    throw new Error(
      '🟡 [VisualBuilder] [OptimizelyComposition] The factory must be defined within the serverContext'
    )

  const [contentLink, contentTypes, nodeId, fragmentData, layoutProps] =
    nodePropsFactory(node)
  const firstExistingType = contentTypes
    .map((ct) => factory.has([...ct].reverse()))
    .indexOf(true)
  const contentType = contentTypes[firstExistingType]
  if (!contentType)
    throw new Error(
      `🟡 [VisualBuilder] [OptimizelyComposition] The factory must have a definition for one of these types: ${contentTypes.map((x) => x.join('/')).join(', ')}`
    )

  return (
    <CmsContent
      contentType={contentType}
      contentLink={contentLink}
      fragmentData={fragmentData}
      layoutProps={layoutProps}
      editorComponentId={nodeId || contentLink.key || undefined}
      noDataLoad
      ctx={ctx}
    >
      {(node.nodes ?? []).map((child) => {
        const childKey = child.key ? child.key : `vb::${JSON.stringify(child)}`
        return (
          <OptimizelyComposition
            key={childKey}
            node={child}
            leafPropsFactory={leafPropsFactory}
            nodePropsFactory={nodePropsFactory}
            ctx={ctx}
            cmsContent={CmsContent}
          />
        )
      })}
    </CmsContent>
  )
}

export default OptimizelyComposition
