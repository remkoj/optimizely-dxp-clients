import { ReactNode } from 'react'
import {
  isComponentNode,
  isStructureNode,
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
  isMaster = true
}: BaseOptimizelyCompositionProps & { isMaster: boolean }): ReactNode {
  const { factory } = ctx

  // If this is the master composition and the node is a structure node with children, render 
  // the children directly to avoid unnecessary nesting
  if (isMaster && isStructureNode(node) && Array.isArray(node.nodes) && node.nodes.length > 0) {
    return node.nodes.map((child) => {
      const childKey = child.key ? child.key : `vb::${JSON.stringify(child)}`
      return (
        <OptimizelyComposition
          key={childKey}
          node={child}
          leafPropsFactory={leafPropsFactory}
          nodePropsFactory={nodePropsFactory}
          ctx={ctx}
          cmsContent={CmsContent}
          isMaster={false}
        />
      )
    })
  }

  // Render the element
  if (isComponentNode(node)) {
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

  // Ensure we've got a factory
  if (!factory)
    throw new Error(
      '🟡 [VisualBuilder] [OptimizelyComposition] The factory must be defined within the Context'
    )

  const [contentLink, contentTypes, nodeId, fragmentData, layoutProps] =
    nodePropsFactory(node)
  const firstExistingType = contentTypes
    .map((ct) => factory.has(Array.isArray(ct) ? [...ct].reverse() : ct))
    .indexOf(true)
  const contentType = contentTypes[firstExistingType]
  if (!contentType)
    throw new Error(
      `🟡 [VisualBuilder] [OptimizelyComposition] The factory must have a definition for one of these types: ${contentTypes.map((x) => Array.isArray(x) ? x.join('/') : x).join(', ')}`
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
            isMaster={false}
          />
        )
      })}
    </CmsContent>
  )
}

export default OptimizelyComposition
