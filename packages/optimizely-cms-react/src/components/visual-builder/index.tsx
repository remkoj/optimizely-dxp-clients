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
    const [contentLink, contentType, fragmentData, layoutProps] =
      leafPropsFactory(node)
    return (
      <CmsContent
        contentLink={contentLink}
        contentType={contentType}
        fragmentData={fragmentData}
        layoutProps={layoutProps}
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

  const [contentLink, contentTypes, fragmentData, layoutProps] =
    nodePropsFactory(node)
  const contentType = contentTypes.find((ct) => factory.has([...ct].reverse()))
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
      noDataLoad
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
