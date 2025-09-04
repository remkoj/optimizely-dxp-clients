import { type ComponentType, type PropsWithChildren, type JSX } from "react"
import { type InlineContentLinkWithLocale, type ContentLinkWithLocale } from "@remkoj/optimizely-graph-client"
import { type ContentType } from "../../types.js"
import { type PropsWithContext, type PropsWithOptionalContext } from "../../context/types.js"
import { type PropsWithCmsContent } from "../cms-content/types.js"

export enum StructureNodeTypes {
  Experience = "experience",
  Section = "section",
  Row = "row",
  Column = "column"
}
export type CompositionNodeBase = {
  name: string | null
  key: string | null
  type?: string | null
  template?: string | null
  settings?: Array<{ key: string, value: string | number | boolean } | null> | null
}
export type CompositionStructureNode = CompositionNodeBase & {
  layoutType: "experience" | "section" | "row" | "column"
  nodes?: Array<CompositionNode>
}
export type CompositionComponentNode<E extends Record<string, any> = Record<string, any>> = CompositionNodeBase & {
  layoutType: "component"
  component: E
}
export type CompositionNode<E extends Record<string, any> = Record<string, any>> = CompositionStructureNode | CompositionComponentNode<E>
export type CompositionComponentType<NT extends CompositionNode> = ComponentType<NT extends CompositionComponentNode<infer DT> ? { node: Omit<NT, 'element'>, element: DT } : PropsWithChildren<{ node: Omit<NT, 'nodes'> }>>
/**
 * Get the props to render a leaf inside an experience
 * 
 * @returns   An array with the contentLink, Content Type, Node ID, Loaded Data & Layout Properties
 */
export type LeafPropsFactory = <ET extends Record<string, any>, LT = string>(node: CompositionComponentNode<ET>) => [ContentLinkWithLocale<LT> | InlineContentLinkWithLocale<LT>, ContentType, string | undefined, ET] | [ContentLinkWithLocale<LT> | InlineContentLinkWithLocale<LT>, ContentType, string | undefined, ET, Record<string, any>]
export type NodePropsFactory = <ET extends Record<string, any>, LT = string>(node: CompositionStructureNode) => [ContentLinkWithLocale<LT> | InlineContentLinkWithLocale<LT>, Array<ContentType>, string | undefined, ET] | [ContentLinkWithLocale<LT> | InlineContentLinkWithLocale<LT>, Array<ContentType>, string | undefined, ET, Record<string, any>]

export type OptimizelyCompositionProps = PropsWithOptionalContext<JSX.IntrinsicAttributes & {
  /**
   * The Visual Builder node to start rendering from
   */
  node: CompositionNode<Record<string, any>>

  /**
   * Allows overriding of the factory that transforms the data received from
   * Optimizely Graph into properties for an element.
   */
  leafPropsFactory?: LeafPropsFactory

  /**
   * Allows overriding of the factory that transforms the data received from
   * Optimizely Graph into properties for a structure node.
   */
  nodePropsFactory?: NodePropsFactory
}>

export type BaseOptimizelyCompositionProps = PropsWithCmsContent<PropsWithContext<OptimizelyCompositionProps>>

export type OptimizelyCompositionComponent = ComponentType<OptimizelyCompositionProps>

export type OptimizelyCompositionBaseComponent = ComponentType<BaseOptimizelyCompositionProps>