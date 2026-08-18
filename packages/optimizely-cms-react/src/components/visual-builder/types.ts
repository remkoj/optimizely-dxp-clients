import { type ComponentType, type PropsWithChildren, type JSX } from "react"
import { type InlineContentLinkWithLocale, type ContentLinkWithLocale } from "@remkoj/optimizely-graph-client"
import { type ContentType } from "../../types.js"
import { type PropsWithContext, type PropsWithOptionalContext } from "../../context/types.js"
import { type PropsWithCmsContent } from "../cms-content/types.js"
import type { LayoutProps } from '../cms-styles/index.js'

/**
 * The layout types of the structural (non-component) nodes within a Visual
 * Builder composition
 */
export enum StructureNodeTypes {
  Experience = "experience",
  Section = "section",
  Row = "row",
  Column = "column"
}

/**
 * The properties shared by all Visual Builder composition nodes
 */
export type CompositionNodeBase = {
  name: string | null
  key: string | null
  type?: string | null
  template?: string | null
  settings?: Array<{ key: string, value: string | number | boolean } | null> | null
}

export type CompositionComponent = {
  __name?: string | null,
  _metadata?: Partial<ContentLinkWithLocale> & { types?: ContentType }
} & Record<string,unknown>

/**
 * A structural (layout) node within a Visual Builder composition, which may
 * contain child nodes
 */
export type CompositionStructureNode = CompositionNodeBase & {
  layoutType: "experience" | "section" | "row" | "column"
  nodes?: Array<CompositionNode>
  component?: CompositionComponent
}

/**
 * A leaf/component node within a Visual Builder composition, carrying the
 * data of the referenced content item
 */
export type CompositionComponentNode<E extends CompositionComponent = CompositionComponent> = CompositionNodeBase & {
  layoutType: "component"
  component: E
}

/**
 * Any node within a Visual Builder composition, either structural or a component
 */
export type CompositionNode<E extends CompositionComponent = CompositionComponent> = CompositionStructureNode | CompositionComponentNode<E>

/**
 * The React component type used to render a given `CompositionNode`
 */
export type CompositionComponentType<NT extends CompositionNode> = ComponentType<NT extends CompositionComponentNode<infer DT> ? { node: Omit<NT, 'element'>, element: DT } : PropsWithChildren<{ node: Omit<NT, 'nodes'> }>>
/**
 * Get the props to render a leaf inside an experience
 * 
 * @returns   An array with the contentLink, Content Type, Node ID, Loaded Data & Layout Properties
 */
export type LeafPropsFactory = <ET extends CompositionComponent, LT = string>(node: CompositionComponentNode<ET>) => [ContentLinkWithLocale<LT> | InlineContentLinkWithLocale<LT>, ContentType, string | undefined, ET] | [ContentLinkWithLocale<LT> | InlineContentLinkWithLocale<LT>, ContentType, string | undefined, ET, LayoutProps]

/**
 * Get the props to render a structure node inside an experience
 * 
 * @returns   An array with the contentLink, Content Types, Node ID, Loaded Data & Layout Properties
 */
export type NodePropsFactory = <ET extends CompositionComponent, LT = string>(node: CompositionStructureNode) => [ContentLinkWithLocale<LT> | InlineContentLinkWithLocale<LT>, Array<ContentType>, string | undefined, ET] | [ContentLinkWithLocale<LT> | InlineContentLinkWithLocale<LT>, Array<ContentType>, string | undefined, ET, LayoutProps]

export type OptimizelyCompositionProps = PropsWithOptionalContext<JSX.IntrinsicAttributes & {
  /**
   * The Visual Builder node to start rendering from
   */
  node: CompositionNode<CompositionComponent>

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